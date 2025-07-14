import { NextRequest } from "next/server";
import { MastraClient } from "@mastra/client-js";
import { getAuth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

export async function POST(req: NextRequest) {
  // Clerk認証
  const auth = getAuth(req);
  console.log("auth:", auth); // デバッグ用
  if (!auth.userId) {
    return new Response("認証が必要です", { status: 401 });
  }

  const { message, pdfId, threadId } = await req.json();

  // Convexクライアント初期化
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

  // ClerkのuserIdからConvexのuserIdを取得
  const convexUserId = await convex.query(api.tasks.getConvexUserId, {
    clerkUserId: auth.userId,
  });
  console.log("convexUserId:", convexUserId);
  if (!convexUserId) {
    return new Response("ユーザーが見つかりません", { status: 403 });
  }

  // 所有権チェック
  const thread = await convex.query(api.tasks.getThreadIfOwned, {
    threadId,
    userId: convexUserId,
  });
  if (!thread) {
    return new Response("権限がありません", { status: 403 });
  }

  const client = new MastraClient({
    baseUrl: process.env.MASTRA_API_URL || "http://localhost:4111",
  });

  const agent = client.getAgent("pdfAgent");
  const result = await agent.stream({
    messages: [
      { role: "user", content: "currentPdfId: " + pdfId + "です。" },
      { role: "user", content: message },
    ],
    threadId,
    resourceId: pdfId,
  });

  // SSEストリームを返す
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // result.bodyはReadableStream
      const reader = result.body?.getReader();
      if (!reader) {
        controller.close();
        return;
      }
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += new TextDecoder().decode(value);
        // 0:"...AI返答..." の部分を都度抽出して送信
        const matches = buffer.match(/0:"([\s\S]*?)"/g);
        if (matches) {
          for (const m of matches) {
            const text = m.match(/0:"([\s\S]*?)"/)?.[1]?.replace(/\\n/g, "\n");
            if (text) {
              controller.enqueue(encoder.encode(`data: ${text}\n\n`));
            }
          }
          buffer = ""; // 送信済み部分はクリア
        }
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
