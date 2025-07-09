import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import * as fs from "fs/promises";
import * as path from "path";

export const downloadPdfTool = createTool({
  id: "download-pdf",
  description: "指定されたURLからPDFファイルをダウンロードします",
  inputSchema: z.object({
    url: z.string().url().describe("PDFファイルのURL"),
    fileName: z
      .string()
      .optional()
      .describe("保存するファイル名（省略時はURLから自動取得）"),
  }),
  outputSchema: z.object({
    filePath: z.string().describe("保存したPDFファイルのパス"),
  }),
  execute: async ({ context }) => {
    return await downloadPdf(context.url, context.fileName);
  },
});

const downloadPdf = async (url: string, fileName?: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("PDFのダウンロードに失敗しました");
  const buffer = await res.arrayBuffer();

  let name = fileName || path.basename(new URL(url).pathname) || "downloaded";
  let ext = path.extname(name).toLowerCase();

  // 拡張子が.pdf でなければ.pdf を付与 (Arxiv の URL は https://arxiv.org/pdf/1706.03762 のようになっている)
  if (ext !== ".pdf") name += ".pdf";

  const savePath = path.join("/tmp", name);
  await fs.writeFile(savePath, Buffer.from(buffer));
  return { filePath: savePath };
};
