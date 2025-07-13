import { NextRequest } from "next/server";
import { MastraClient } from "@mastra/client-js";

export async function POST(req: NextRequest) {
  const { message, pdfId, threadId } = await req.json();

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
