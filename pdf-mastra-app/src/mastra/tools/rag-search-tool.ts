import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { LibSQLVector } from "@mastra/libsql";
import { geminiEmbeddings, dbPath } from "../models";
import { vectorStore } from "..";

export const ragSearchTool = createTool({
  id: "rag-search",
  description: "RAGデータベースから関連するチャンクや要約を検索します",
  inputSchema: z.object({
    query: z.string().describe("検索クエリ"),
    fileName: z.string().optional().describe("対象PDFファイル名（任意）"),
    pdfId: z.string().optional().describe("PDFの一意ID（任意）"),
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
    // filter条件を組み立て
    let filter: any = undefined;
    if (context.pdfId) {
      filter = { pdfId: context.pdfId };
    } else if (context.fileName) {
      filter = { fileName: context.fileName };
    }
    const results = await vectorStore.query({
      indexName: "pdf_chunks",
      queryVector,
      topK: context.topK,
      filter,
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
