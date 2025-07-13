import { action } from "./_generated/server";
import { v } from "convex/values";
// MastraクライアントSDKをimport
import { MastraClient } from "@mastra/client-js";

export const callMastraWorkflow = action({
  args: {
    url: v.string(),
    pdfId: v.string(),
  },
  handler: async (ctx, args) => {
    const mastraApiUrl = process.env.MASTRA_API_URL || "http://localhost:4111";
    const mastraApiKey = process.env.MASTRA_API_KEY;
    if (mastraApiUrl && mastraApiKey) {
      try {
        // Mastraクライアントを初期化
        const client = new MastraClient({
          baseUrl: mastraApiUrl,
        });
        // ワークフローを取得
        const workflow = client.getWorkflow("pdfRagWorkflow");
        // ランを作成
        const run = await workflow.createRun();
        // ワークフローを非同期実行
        const result = await workflow.startAsync({
          runId: run.runId,
          inputData: {
            url: args.url,
            pdfId: args.pdfId,
          },
        });
        console.log("[callMastraWorkflow] Mastra Workflow SDK result", result);
        return result;
      } catch (e) {
        console.error(
          "[callMastraWorkflow] Mastra Workflow SDK呼び出しエラー",
          e
        );
      }
    } else {
      console.warn("[callMastraWorkflow] Mastra API URLまたはAPIキーが未設定");
    }
  },
});
