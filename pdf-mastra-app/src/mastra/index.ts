import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";

import { weatherWorkflow } from "./workflows/weather-workflow";
import { weatherAgent } from "./agents/weather-agent";
import { pdfAgent } from "./agents/pdf-agent";
import { pdfRagWorkflow } from "./workflows/pdf-rag-workflow";
import { storage, vectorStore } from "./store";

export const mastra = new Mastra({
  workflows: { weatherWorkflow, pdfRagWorkflow },
  agents: { weatherAgent, pdfAgent },
  storage,
  vectors: {
    default: vectorStore,
  },
  logger: new PinoLogger({
    name: "Mastra",
    level: "info",
  }),
});
