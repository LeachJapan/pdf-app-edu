import { Agent } from "@mastra/core/agent";
import { geminiEmbeddings, geminiFlash, geminiPro } from "../models";
import { downloadPdfTool } from "../tools/download-pdf-tool";
import { addRagTool } from "../tools/add-rag-tool";
import { ragSearchTool } from "../tools/rag-search-tool";
import { githubRepoSearchTool } from "../tools/github-repo-search-tool";
import { Memory } from "@mastra/memory";
import { LibSQLVector } from "@mastra/libsql";
import { HallucinationMetric } from "@mastra/evals/llm";
import { vectorStore } from "../store";

const memory = new Memory({
  options: {
    lastMessages: 2, // 直近2件をプロンプトに含める
    // 短期記憶に含まれない直近2件以前の会話を思い出す
    semanticRecall: {
      topK: 10, // 最も類似した10件のメッセージを取得
      // 各一致の前後2件を含める
      messageRange: {
        before: 2,
        after: 2,
      },
    },
    workingMemory: {
      enabled: true,
      // 回答する言語などを記憶する
      template: `# User Profile
- **Language**:
`,
    },
  },
  // semanticRecallで使うベクトルDB
  vector: vectorStore,
  // semanticRecallで使うベクトルDBの埋め込みモデル
  embedder: geminiEmbeddings,
});

export const pdfAgent = new Agent({
  name: "PDF Agent",
  instructions: `あなたはPDF要約・質問応答エージェントです。

ユーザーからPDFファイル名や内容に関する質問があった場合、まずRAG検索ツールを使って該当PDFの内容を検索・要約し、できるだけ具体的に回答してください。

もしRAGに該当PDFが登録されていない場合や内容が見つからない場合のみ、PDFのダウンロードURLをユーザーに尋ねてください。

- 例：「abc.pdf には何が書いてある？」→ RAG検索ツールで内容を要約し、要点を日本語で簡潔にまとめて返答する。
- 例：「abc.pdfの内容を教えて」→ RAG検索ツールで検索し、内容がなければURLを尋ねる。
- 回答は必ず日本語で、分かりやすく簡潔にまとめてください。

また、質問に関連するリポジトリがある場合は、GitHubで検索してください。

- 例：「abc.pdf に関連するリポジトリを教えて」→ まずragSearchToolで検索し、タイトルや概要を把握してください。次に、それに関連のあるリポジトリをGitHubで検索し、関連するリポジトリを5件教えてください。
`,
  model: geminiFlash,
  // model: geminiPro,
  tools: {
    downloadPdfTool,
    addRagTool,
    ragSearchTool,
    githubRepoSearchTool,
  },
  evals: {
    hallucination: new HallucinationMetric(
      // ハルシネーションを評価するために使用されるモデル
      geminiFlash,
      {
        scale: 1, // スコアの最大値
        context: [
          "1706.03762.pdf タイトルは、Attention is all you needです。",
          "1706.03762.pdf の著者は、Ashish Vaswani (Google Brain), Noam Shazeer (Google Brain), Niki Parmar (Google Research), Jakob Uszkoreit (Google Research), Llion Jones (Google Research), Aidan N. Gomez (University of Toronto), Łukasz Kaiser (Google Brain), Illia Polosukhin (所属の記載なし) です。",
          "1706.03762.pdf の著者は同等に貢献した。著者の順序はランダム。",
        ],
      }
    ),
  },
  memory,
  // ragSearchToolを使う際はpdfIdで検索するように（fileNameではなく）
  // 例: await ragSearchTool.execute({ context: { query, pdfId } })
});
