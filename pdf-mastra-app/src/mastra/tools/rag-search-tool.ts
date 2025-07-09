import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { LibSQLVector } from "@mastra/libsql";
import { geminiEmbeddings } from "../models";

export const ragSearchTool = createTool({
  id: "rag-search",
  description: "RAGデータベースから関連するチャンクや要約を検索します",
  inputSchema: z.object({
    query: z.string().describe("検索クエリ"),
    fileName: z.string().optional().describe("対象PDFファイル名（任意）"),
    topK: z.number().optional().default(5),
  }),
  outputSchema: z.object({
    results: z.array(
      z.object({
        text: z.string(),
        fileName: z.string(),
        page: z.number().optional(),
        score: z.number(),
        summary: z.string().optional(),
        keywords: z.string().optional(),
      })
    ),
  }),
  execute: async ({ context }) => {
    // 1. クエリを埋め込みベクトル化
    const embeddingResult = await geminiEmbeddings.doEmbed({
      values: [context.query],
    });
    const queryVector = embeddingResult.embeddings[0];

    // 2. ベクトルDBから類似チャンクを検索
    const store = new LibSQLVector({ connectionUrl: "file:rag.db" });
    const results = await store.query({
      indexName: "pdf_chunks",
      queryVector,
      topK: context.topK,
      filter: context.fileName ? { fileName: context.fileName } : undefined,
    });

    // 3. 結果を整形して返す
    return {
      results: results.map((r) => ({
        text: r.metadata?.text ?? "",
        fileName: r.metadata?.fileName ?? "",
        page: r.metadata?.page,
        score: r.score,
        summary: r.metadata?.summary,
        keywords: r.metadata?.keywords,
      })),
    };
  },
});
