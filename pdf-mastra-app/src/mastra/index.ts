import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore, LibSQLVector } from "@mastra/libsql";
import { weatherWorkflow } from "./workflows/weather-workflow";
import { weatherAgent } from "./agents/weather-agent";
import { pdfAgent } from "./agents/pdf-agent";
import { pdfRagWorkflow } from "./workflows/pdf-rag-workflow";
import { geminiEmbeddingsDim } from "./models";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 永続DBファイルの絶対パスを指定
const dbPath = "file:" + path.resolve(__dirname, "../../rag.db");

// サーバー起動時に一度だけpdf_chunksインデックスを作成
(async () => {
  const store = new LibSQLVector({
    connectionUrl: dbPath,
  });
  try {
    await store.createIndex({
      indexName: "pdf_chunks",
      dimension: geminiEmbeddingsDim,
    });
    console.log("✅ pdf_chunks index created or already exists");
  } catch (e) {
    console.error("❌ createIndex error", e);
  }
})();

export const mastra = new Mastra({
  workflows: { weatherWorkflow, pdfRagWorkflow },
  agents: { weatherAgent, pdfAgent },
  storage: new LibSQLStore({
    url: dbPath, // 永続DBを利用
  }),
  logger: new PinoLogger({
    name: "Mastra",
    level: "info",
  }),
});
