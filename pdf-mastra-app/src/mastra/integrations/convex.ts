import fetch from "node-fetch";

const CONVEX_API_URL = process.env.CONVEX_API_URL!; // 例: https://your-convex-url
const CONVEX_API_KEY = process.env.CONVEX_API_KEY!;

export async function updatePdfRagMetaViaApi({
  pdfId,
  ragSummary,
  ragKeywords,
  ragEmbedding,
  lastRagUpdatedAt,
  apiKey,
}: {
  pdfId: string;
  ragSummary?: string;
  ragKeywords?: string[];
  ragEmbedding?: number[];
  lastRagUpdatedAt?: number;
  apiKey: string;
}) {
  const url = `${CONVEX_API_URL}/api/mutation`;
  const body = {
    path: "tasks:updatePdfRagMeta",
    args: {
      pdfId,
      ragSummary,
      ragKeywords,
      ragEmbedding,
      lastRagUpdatedAt,
      apiKey,
    },
    format: "json",
  };
  console.log("[Convex API] 送信内容", { url, body });
  const res = await fetch(url, {
    method: "POST",
    headers: {
      // Authorization: `Bearer ${CONVEX_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const resText = await res.text();
  console.log("[Convex API] レスポンスstatus", res.status);
  console.log("[Convex API] レスポンスbody", resText);
  if (!res.ok) {
    throw new Error(`Convex API error: ${res.status} ${resText}`);
  }
  return JSON.parse(resText);
}
