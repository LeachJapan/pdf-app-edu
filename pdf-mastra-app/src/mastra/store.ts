import path from "path";
import { fileURLToPath } from "url";
import { geminiEmbeddingsDim } from "./models";
import { UpstashStore, UpstashVector } from "@mastra/upstash";
import { LibSQLStore, LibSQLVector } from "@mastra/libsql";

// .envから取得
const useUpstash =
  process.env.USE_UPSTASH === "1" || process.env.NODE_ENV === "production";

// LibSQL用パス
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = "file:" + path.resolve(__dirname, "../../rag.db");

if (!useUpstash) {
  // LibSQLVectorのインスタンス
  const libsqlVector = new LibSQLVector({
    connectionUrl: dbPath,
  });
  // 3072はGemini埋め込みの場合。OpenAIなら1536など
  libsqlVector
    .createIndex({
      indexName: "pdf_chunks",
      dimension: geminiEmbeddingsDim,
    })
    .then(() => {
      console.log("✅ pdf_chunks index created or already exists");
    })
    .catch((e) => {
      console.error("❌ createIndex error", e);
    });
}

// ストレージ/ベクトルDBの切り替え
export const storage = useUpstash
  ? new UpstashStore({
      url: process.env.UPSTASH_URL!,
      token: process.env.UPSTASH_TOKEN!,
    })
  : new LibSQLStore({
      url: dbPath,
    });

export const vectorStore = useUpstash
  ? new UpstashVector({
      url: process.env.UPSTASH_VECTOR_URL!,
      token: process.env.UPSTASH_VECTOR_TOKEN!,
    })
  : new LibSQLVector({
      connectionUrl: dbPath,
    });
