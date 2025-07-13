import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { fileURLToPath } from "url";
import path from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const dbPath = "file:" + path.resolve(__dirname, "../../rag.db");

console.log("dbPath", dbPath);

export const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
});

export const geminiFlash = google("gemini-2.5-flash");
export const geminiPro = google("gemini-1.5-pro-latest");

export const geminiEmbeddings = google.textEmbeddingModel(
  "gemini-embedding-exp-03-07"
);
export const geminiEmbeddingsDim = 3072;

export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
  compatibility: "strict",
});
