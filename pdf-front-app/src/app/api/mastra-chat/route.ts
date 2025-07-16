import { NextRequest } from "next/server";
import { MastraClient } from "@mastra/client-js";
import { getAuth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import Stripe from "stripe";

const MAX_FREE_TOKEN = 1000; // 無料枠上限
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil",
});

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

  // Convexユーザー情報を取得
  const user = await convex.query(api.tasks.getUser, {
    userId: convexUserId,
    apiKey: process.env.MASTRA_API_KEY!,
  });
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const used = user?.tokenUsageByMonth?.[ym] ?? 0;
  let stripeCustomerId: string = user?.stripeCustomerId ?? "";

  // 既存のSubscriptionを検索
  let subscriptionItemId: string = "";
  let subscriptions;
  if (stripeCustomerId && stripeCustomerId !== "") {
    subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: "active",
      expand: ["data.items"],
    });
    // 指定のPrice IDに紐づくSubscription Itemを探す
    for (const sub of subscriptions.data) {
      for (const item of sub.items.data) {
        if (item.price.id === process.env.STRIPE_SUBSCRIPTION_PRICE_ID) {
          subscriptionItemId = item.id;
          break;
        }
      }
      if (subscriptionItemId) break;
    }
  }

  const hasSubscription = subscriptionItemId !== "";

  // Stripe顧客IDがなければ新規作成
  if (!stripeCustomerId || stripeCustomerId === "") {
    const customer = await stripe.customers.create({
      email: (user as { email?: string }).email ?? undefined,
    });
    stripeCustomerId = customer.id;
    await convex.mutation(api.tasks.updateStripeCustomerId, {
      userId: convexUserId,
      stripeCustomerId,
      apiKey: process.env.MASTRA_API_KEY!,
    });
  }

  if (used >= MAX_FREE_TOKEN && !hasSubscription) {
    // Checkout Session作成
    const sessionParams: any = {
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: process.env.STRIPE_SUBSCRIPTION_PRICE_ID!,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?checkout=cancel`,
    };
    if (stripeCustomerId && stripeCustomerId !== "") {
      sessionParams.customer = stripeCustomerId;
    }
    const session = await stripe.checkout.sessions.create(sessionParams);
    return new Response(
      JSON.stringify({
        error: "無料枠を超えました。有料プラン登録が必要です。",
        checkoutUrl: session.url,
      }),
      { status: 402, headers: { "Content-Type": "application/json" } }
    );
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
      let lastUsage = null;
      while (true) {
        const { done, value } = await reader.read();
        if (value) {
          const chunkStr = new TextDecoder().decode(value);
          console.log("[mastra-chat] chunk:", chunkStr); // ← ここで全出力
          buffer += chunkStr;
        }
        if (done) {
          // ストリーム終了時に最後のチャンクからusage情報を取得
          try {
            const chunks = buffer.split("\n").filter((chunk) => chunk.trim());
            for (const chunk of chunks) {
              // 例: e:{"finishReason":"stop","usage":{...}}
              const jsonPart = chunk.replace(/^[a-z]:/, ""); // 先頭1文字+コロンを除去
              try {
                const obj = JSON.parse(jsonPart);
                if (obj.usage) {
                  lastUsage = obj.usage;
                }
              } catch {} // JSONでなければ無視
            }
            // 最後に取得したusageを使う
            if (lastUsage) {
              const totalTokens =
                (lastUsage.promptTokens || 0) +
                (lastUsage.completionTokens || 0);
              // Convexに加算
              await convex.mutation(api.tasks.addTokenUsageFromMastra, {
                userId: convexUserId,
                tokens: totalTokens,
                apiKey: process.env.MASTRA_API_KEY!,
              });
              console.log(
                `[mastra-chat] トークン加算完了: ${totalTokens} tokens`
              );

              // 従量課金: Usage Record送信
              if (subscriptionItemId) {
                // Stripe Meter Event APIで送信
                await stripe.billing.meterEvents.create({
                  event_name: "tokens",
                  timestamp: Math.floor(Date.now() / 1000),
                  payload: {
                    stripe_customer_id: stripeCustomerId,
                    value: totalTokens.toString(),
                  },
                });
                console.log(
                  `[mastra-chat] Stripe Meter Event送信: ${totalTokens} tokens`
                );
              }
            }
          } catch (error) {
            console.error("[mastra-chat] usage解析エラー:", error);
          }
          break;
        }
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
