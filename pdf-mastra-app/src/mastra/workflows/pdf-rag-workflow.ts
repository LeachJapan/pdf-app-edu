import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { ragSearchTool } from "../tools/rag-search-tool";
import { downloadPdfTool } from "../tools/download-pdf-tool";
import { addRagTool } from "../tools/add-rag-tool";
import { pdfAgent } from "../agents/pdf-agent";
import { updatePdfRagMetaViaApi } from "../integrations/convex";

function extractFileName(url: string): string {
  // クエリやフラグメントを除去
  let last = url.split("/").pop() || "";
  last = last.split("?")[0].split("#")[0];
  // 拡張子が「.pdf」で終わっていなければ付与
  if (!last.toLowerCase().endsWith(".pdf")) {
    last += ".pdf";
  }
  return last;
}

// ファイル名抽出ステップ
const extractFileNameStep = createStep({
  id: "extractFileName",
  inputSchema: z.object({ url: z.string(), pdfId: z.string() }),
  outputSchema: z.object({
    url: z.string(),
    fileName: z.string(),
    pdfId: z.string(),
  }),
  execute: async ({ inputData }) => {
    return {
      url: inputData.url,
      fileName: extractFileName(inputData.url),
      pdfId: inputData.pdfId,
    };
  },
});

// 1. RAG検索ステップ
const searchRagStep = createStep({
  id: "searchRag",
  inputSchema: z.object({
    url: z.string(),
    fileName: z.string(),
    pdfId: z.string(),
  }),
  outputSchema: z.object({
    url: z.string(),
    fileName: z.string(),
    exists: z.boolean(),
    pdfId: z.string(),
  }),
  execute: async (ctx) => {
    const { url, fileName, pdfId } = ctx.inputData;
    const res = await ragSearchTool.execute({
      context: { query: "", pdfId, topK: 10 }, // pdfIdで検索
      runtimeContext: ctx.runtimeContext,
    });
    return { url, fileName, exists: (res.results?.length ?? 0) > 0, pdfId };
  },
});

// 2. ダウンロードステップ
const downloadStep = createStep({
  id: "downloadPdf",
  inputSchema: z.object({
    url: z.string(),
    fileName: z.string(),
    exists: z.boolean(),
    pdfId: z.string(),
  }),
  outputSchema: z.object({
    url: z.string(),
    fileName: z.string(),
    exists: z.boolean(),
    filePath: z.string(),
    pdfId: z.string(),
  }),
  execute: async (ctx) => {
    const { url, fileName, pdfId } = ctx.inputData;
    // exists判定を無視して常にダウンロード
    const res = await downloadPdfTool.execute({
      context: { url },
      runtimeContext: ctx.runtimeContext,
    });
    return { url, fileName, exists: false, filePath: res.filePath, pdfId };
  },
});

// 3. RAG追加ステップ
const addRagStep = createStep({
  id: "addRag",
  inputSchema: z.object({
    url: z.string(),
    fileName: z.string(),
    exists: z.boolean(),
    filePath: z.string(),
    pdfId: z.string(),
  }),
  outputSchema: z.object({
    url: z.string(),
    fileName: z.string(),
    exists: z.boolean(),
    filePath: z.string(),
    success: z.boolean(),
    pdfId: z.string(),
  }),
  execute: async (ctx) => {
    const { url, fileName, filePath, pdfId } = ctx.inputData;
    // exists判定を無視して常にRAG追加
    const res = await addRagTool.execute({
      context: { filePath, pdfId }, // pdfIdを渡す
      runtimeContext: ctx.runtimeContext,
    });
    return {
      url,
      fileName,
      exists: false,
      filePath,
      success: res.success,
      pdfId,
    };
  },
});

// 4. 要約ステップ
const summarizeStep = createStep({
  id: "summarizePdf",
  inputSchema: z.object({
    url: z.string(),
    fileName: z.string(),
    exists: z.boolean(),
    filePath: z.string(),
    success: z.boolean(),
    pdfId: z.string(),
  }),
  outputSchema: z.object({
    url: z.string(),
    summary: z.string(),
    keywords: z.array(z.string()), // 必須
    pdfId: z.string(),
  }),
  execute: async (ctx) => {
    const { url, fileName, filePath, success, pdfId } = ctx.inputData;
    // exists判定を無視して常に要約
    if (!filePath || !success) {
      return { url, summary: "PDFの追加に失敗しました。", keywords: [], pdfId };
    } else {
      const summaryRes = await pdfAgent.generate(
        `resourceId: ${pdfId} の内容を要約してください。`
      );
      const keywordsRes = await pdfAgent.generate(
        `resourceId: ${pdfId} の内容に関連するキーワードを5つ以上抽出し、カンマ区切りで出力してください。`
      );
      const keywords = keywordsRes.text
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean); // 例: 日本語カンマ区切り対応

      return { url, summary: summaryRes.text, keywords, pdfId };
    }
  },
});

// ConvexへRAGメタ情報を保存するステップ
const saveRagMetaStep = createStep({
  id: "saveRagMeta",
  inputSchema: z.object({
    url: z.string(),
    fileName: z.string(),
    exists: z.boolean(),
    filePath: z.string(),
    success: z.boolean(),
    summary: z.string(),
    keywords: z.array(z.string()),
    pdfId: z.string(),
  }),
  outputSchema: z.object({
    url: z.string(),
    summary: z.string(),
    pdfId: z.string(),
  }),
  execute: async (ctx) => {
    try {
      await updatePdfRagMetaViaApi({
        pdfId: ctx.inputData.pdfId,
        ragSummary: ctx.inputData.summary,
        ragKeywords: ctx.inputData.keywords,
        lastRagUpdatedAt: Date.now(),
      });
    } catch (e) {
      console.error("Convex連携エラー", e);
    }
    return {
      url: ctx.inputData.url,
      summary: ctx.inputData.summary,
      pdfId: ctx.inputData.pdfId,
    };
  },
});

// メインワークフロー
export const pdfRagWorkflow = createWorkflow({
  id: "pdf-rag-workflow",
  inputSchema: z.object({ url: z.string(), pdfId: z.string() }),
  outputSchema: z.object({
    url: z.string(),
    summary: z.string(),
    pdfId: z.string(),
  }),
})
  .then(extractFileNameStep)
  .then(searchRagStep)
  .then(downloadStep)
  .then(addRagStep)
  .then(summarizeStep)
  .then(saveRagMetaStep)
  .commit();
