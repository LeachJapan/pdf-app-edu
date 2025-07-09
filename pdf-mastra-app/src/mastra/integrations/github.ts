import { GithubIntegration as BaseGithubIntegration } from "@mastra/github";

class CustomGithubIntegration extends BaseGithubIntegration {
  async getApiClient() {
    const client = await super.getApiClient();
    // Authorizationヘッダーをカスタマイズ
    if (client.client && client.client.interceptors?.request) {
      client.client.interceptors.request.use((request: any) => {
        const token = this.config.PERSONAL_ACCESS_TOKEN;
        if (token) {
          request.headers.set("Authorization", `Bearer ${token}`);
        } else {
          request.headers.delete("Authorization");
        }
        return request;
      });
    }
    return client;
  }
}

export const github = new CustomGithubIntegration({
  config: {
    PERSONAL_ACCESS_TOKEN: process.env.GITHUB_PAT || "",
  },
});
