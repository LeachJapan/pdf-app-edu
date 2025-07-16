import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import * as fs from "fs/promises";
import * as path from "path";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

const isProd = process.env.NODE_ENV === "production";
const workerPath = isProd
  ? path.resolve("/app/.mastra/pdf.worker.mjs")
  : path.resolve(process.cwd(), "pdf.worker.mjs");

// fileスキーム付きで指定（必要な場合）
if (isProd) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    process.env.NODE_ENV === "production"
      ? "./.mastra/pdf.worker.mjs"
      : "./pdf.worker.mjs";
}

import { MDocument } from "@mastra/rag";
import { geminiEmbeddings, geminiFlash } from "../models";
import { vectorStore } from "../store";

export const addRagTool = createTool({
  id: "add-rag",
  description:
    "PDFファイルをテキスト化し、チャンク分割・Gemini埋め込みでLibSQLVectorに追加します",
  inputSchema: z.object({
    filePath: z.string().describe("PDFファイルのパス"),
    title: z.string().optional().describe("ドキュメントのタイトル（任意）"),
    pdfId: z.string().describe("PDFの一意ID").optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    fileName: z.string().describe("元PDFファイル名"),
    numPages: z.number().describe("PDFのページ数"),
  }),
  execute: async ({ context }) => {
    return await addPdfToRag(context.filePath, context.title, context.pdfId);
  },
});

const addPdfToRag = async (
  filePath: string,
  title?: string,
  pdfId?: string
) => {
  console.log("addPdfToRag");
  const pdfData = new Uint8Array(await fs.readFile(filePath));
  const fileName = path.basename(filePath);

  const loadingTask = pdfjsLib.getDocument({ data: pdfData });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  console.log("getting text content");
  let markdown = "";
  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent({
      includeMarkedContent: true,
      disableNormalization: false,
    });
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join("\n");
    markdown += `\n\n## Page ${i}\n\n${pageText}`;
  }

  console.log("chunking");
  // チャンク分割
  const doc = MDocument.fromMarkdown(markdown);
  console.log("chunking start");
  const chunks = await doc.chunk({
    strategy: "markdown",
    headers: [
      ["#", "title"],
      ["##", "section"],
    ],
    extract: {
      summary: {
        llm: geminiFlash,
      },
      keywords: {
        llm: geminiFlash,
      },
    },
    size: 512,
    overlap: 50,
  });
  console.log("chunking done");

  // sectionからページ番号を抽出する関数
  function extractPageNumber(section?: string): number | undefined {
    if (!section) return undefined;
    const match = section.match(/Page\s*(\d+)/i);
    return match ? Number(match[1]) : undefined;
  }

  // チャンクごとにGemini埋め込み生成＆保存
  console.log("chunks.length", chunks.length);
  for (let i = 0; i < chunks.length; i++) {
    console.log("i", i);
    const chunk = chunks[i];
    const embeddingResult = await geminiEmbeddings.doEmbed({
      values: [chunk.text],
    });
    const embedding = embeddingResult.embeddings[0];
    const id = `${fileName}-chunk-${i + 1}`; // 例: sample.pdf-chunk-1
    const pageNum = extractPageNumber(chunk.metadata?.section);

    console.log("upserting following data");
    console.log({
      text: chunk.text,
      fileName,
      title,
      numPages,
      section: chunk.metadata?.section,
      page: pageNum,
      summary: chunk.metadata?.sectionSummary,
      keywords: chunk.metadata?.excerptKeywords,
    });

    await vectorStore.upsert({
      indexName: "pdf_chunks",
      vectors: [embedding],
      metadata: [
        {
          text: chunk.text,
          fileName,
          title,
          numPages,
          section: chunk.metadata?.section,
          page: pageNum,
          summary: chunk.metadata?.sectionSummary,
          keywords: chunk.metadata?.excerptKeywords,
          pdfId,
        },
      ],
      ids: [id],
    });
  }

  return {
    success: true,
    message: "PDFをチャンク分割しGemini埋め込みでRAGに追加しました",
    fileName,
    numPages,
  };
};
