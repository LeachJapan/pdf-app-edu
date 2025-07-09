import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { github } from "../integrations/github";

export const githubRepoSearchTool = createTool({
  id: "github-repo-search",
  description: "GitHubで関連リポジトリを検索します（Mastra公式統合利用）",
  inputSchema: z.object({
    query: z.string().describe("検索キーワード（論文タイトルや要約など）"),
    topK: z.number().optional().default(5),
  }),
  outputSchema: z.object({
    results: z.array(
      z.object({
        name: z.string(),
        url: z.string(),
        description: z.string().optional(),
        stars: z.number().optional(),
        topics: z.array(z.string()).optional(),
      })
    ),
  }),
  execute: async ({ context }) => {
    const { query, topK } = context;
    const client = await github.getApiClient();
    const res = await client.searchRepos({
      query: {
        q: query,
        per_page: topK,
        sort: "stars",
        order: "desc",
      },
    });
    console.log(res);
    const items = res.data?.items ?? [];
    return {
      results: items.map((repo) => ({
        name: repo.full_name,
        url: repo.html_url,
        description: repo.description ?? undefined,
        stars: repo.stargazers_count,
        topics: repo.topics ?? [],
      })),
    };
  },
});
