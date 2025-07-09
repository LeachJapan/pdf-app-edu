import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { ragSearchTool } from "../tools/rag-search-tool";
import { downloadPdfTool } from "../tools/download-pdf-tool";
import { addRagTool } from "../tools/add-rag-tool";
import { pdfAgent } from "../agents/pdf-agent";

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
  inputSchema: z.object({ url: z.string() }),
  outputSchema: z.object({ url: z.string(), fileName: z.string() }),
  execute: async ({ inputData }) => {
    return {
      url: inputData.url,
      fileName: extractFileName(inputData.url),
    };
  },
});

// 1. RAG検索ステップ
const searchRagStep = createStep({
  id: "searchRag",
  inputSchema: z.object({ url: z.string(), fileName: z.string() }),
  outputSchema: z.object({
    url: z.string(),
    fileName: z.string(),
    exists: z.boolean(),
  }),
  execute: async (ctx) => {
    const { url, fileName } = ctx.inputData;
    const res = await ragSearchTool.execute({
      context: { query: "", fileName, topK: 10 },
      runtimeContext: ctx.runtimeContext,
    });
    return { url, fileName, exists: (res.results?.length ?? 0) > 0 };
  },
});

// 2. ダウンロードステップ
const downloadStep = createStep({
  id: "downloadPdf",
  inputSchema: z.object({
    url: z.string(),
    fileName: z.string(),
    exists: z.boolean(),
  }),
  outputSchema: z.object({
    url: z.string(),
    fileName: z.string(),
    exists: z.boolean(),
    filePath: z.string(),
  }),
  execute: async (ctx) => {
    const { url, fileName, exists } = ctx.inputData;
    if (exists) {
      return { url, fileName, exists, filePath: "" };
    }
    const res = await downloadPdfTool.execute({
      context: { url },
      runtimeContext: ctx.runtimeContext,
    });
    return { url, fileName, exists, filePath: res.filePath };
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
  }),
  outputSchema: z.object({
    url: z.string(),
    fileName: z.string(),
    exists: z.boolean(),
    filePath: z.string(),
    success: z.boolean(),
  }),
  execute: async (ctx) => {
    const { url, fileName, exists, filePath } = ctx.inputData;
    if (exists || !filePath) {
      return { url, fileName, exists, filePath, success: false };
    }
    const res = await addRagTool.execute({
      context: { filePath },
      runtimeContext: ctx.runtimeContext,
    });
    return { url, fileName, exists, filePath, success: res.success };
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
  }),
  outputSchema: z.object({ url: z.string(), summary: z.string() }),
  execute: async (ctx) => {
    const { url, fileName, exists, filePath, success } = ctx.inputData;
    if (exists) {
      return { url, summary: "すでにRAGに登録済みです。" };
    } else if (!filePath || !success) {
      return { url, summary: "PDFの追加に失敗しました。" };
    } else {
      const res = await pdfAgent.generate(
        `${fileName} の内容を要約してください`
      );
      return { url, summary: res.text };
    }
  },
});

// メインワークフロー
export const pdfRagWorkflow = createWorkflow({
  id: "pdf-rag-workflow",
  inputSchema: z.object({ url: z.string() }),
  outputSchema: z.object({ url: z.string(), summary: z.string() }),
})
  .then(extractFileNameStep)
  .then(searchRagStep)
  .then(downloadStep)
  .then(addRagStep)
  .then(summarizeStep)
  .commit();
