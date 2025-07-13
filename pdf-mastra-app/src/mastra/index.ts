import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { UpstashStore, UpstashVector } from "@mastra/upstash";
import { weatherWorkflow } from "./workflows/weather-workflow";
import { weatherAgent } from "./agents/weather-agent";
import { pdfAgent } from "./agents/pdf-agent";
import { pdfRagWorkflow } from "./workflows/pdf-rag-workflow";
import { geminiEmbeddingsDim } from "./models";

// .envから取得
const upstashUrl = process.env.UPSTASH_URL!;
const upstashToken = process.env.UPSTASH_TOKEN!;
export const vectorStore = new UpstashVector({
  url: upstashUrl,
  token: upstashToken,
});

export const mastra = new Mastra({
  workflows: { weatherWorkflow, pdfRagWorkflow },
  agents: { weatherAgent, pdfAgent },
  storage: new UpstashStore({
    url: upstashUrl,
    token: upstashToken,
  }),
  vectors: {
    default: vectorStore,
  },
  logger: new PinoLogger({
    name: "Mastra",
    level: "info",
  }),
});
