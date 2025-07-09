# ディレクトリ構成

## プロジェクト全体構造

```
edu/
├── .cursor/                          # Cursor設定ファイル
│   ├── global.mdc                    # グローバル設定
│   ├── technologystack.md            # 技術スタック定義
│   └── mcp.json                      # MCP設定
├── pdf-front-app/                    # Next.jsフロントエンドアプリケーション
└── pdf-mastra-app/                   # Mastra AIエージェントアプリケーション
```

## pdf-front-app（フロントエンド）

### ルートディレクトリ

```
pdf-front-app/
├── .git/                            # Gitリポジトリ
├── .next/                           # Next.jsビルド出力
├── node_modules/                     # 依存関係
├── convex/                          # Convexバックエンド
├── public/                          # 静的ファイル
├── src/                             # ソースコード
├── package.json                      # プロジェクト設定
├── package-lock.json                 # 依存関係ロック
├── tsconfig.json                     # TypeScript設定
├── next.config.ts                    # Next.js設定
├── postcss.config.mjs               # PostCSS設定
├── eslint.config.mjs                # ESLint設定
├── next-env.d.ts                    # Next.js型定義
├── .gitignore                       # Git除外設定
├── README.md                        # プロジェクト説明
└── sampleData.jsonl                 # サンプルデータ
```

### src/（ソースコード）

```
src/
└── app/                             # Next.js App Router
    ├── page.tsx                     # メインページ（タスク管理UI）
    ├── layout.tsx                   # ルートレイアウト
    ├── ConvexClientProvider.tsx     # Convexクライアント設定
    ├── globals.css                  # グローバルスタイル
    └── favicon.ico                  # ファビコン
```

### convex/（バックエンド）

```
convex/
├── _generated/                      # Convex自動生成ファイル
│   ├── api.d.ts                     # API型定義
│   ├── api.js                       # API実装
│   ├── server.d.ts                  # サーバー型定義
│   ├── server.js                    # サーバー実装
│   └── dataModel.d.ts               # データモデル型定義
├── tasks.ts                         # タスク管理API
├── tsconfig.json                    # Convex TypeScript設定
└── README.md                        # Convex説明
```

### public/（静的ファイル）

```
public/
├── vercel.svg                       # Vercelロゴ
├── globe.svg                        # グローブアイコン
├── next.svg                         # Next.jsロゴ
├── window.svg                       # ウィンドウアイコン
└── file.svg                         # ファイルアイコン
```

## pdf-mastra-app（AI エージェント）

### ルートディレクトリ

```
pdf-mastra-app/
├── .git/                            # Gitリポジトリ
├── node_modules/                     # 依存関係
├── .mastra/                         # Mastra設定・データ
├── src/                             # ソースコード
├── package.json                      # プロジェクト設定
├── package-lock.json                 # 依存関係ロック
├── tsconfig.json                     # TypeScript設定
├── .node-version                    # Node.jsバージョン指定
├── .gitignore                       # Git除外設定
└── README.md                        # プロジェクト説明
```

### .mastra/（Mastra 設定・データ）

```
.mastra/
├── mastra.db                        # LibSQLデータベース
├── mastra.db-shm                    # SQLite共有メモリ
├── mastra.db-wal                    # SQLite WALファイル
└── output/                          # 出力ディレクトリ
    └── .build/                      # ビルド出力
```

### src/（ソースコード）

```
src/
└── mastra/                          # Mastraアプリケーション
    ├── index.ts                     # メインエントリーポイント
    ├── workflows/                   # ワークフロー定義
    ├── agents/                      # エージェント定義
    ├── tools/                       # ツール定義
    ├── integrations/                # 外部統合
    └── models/                      # モデル定義
```

### src/mastra/workflows/（ワークフロー）

```
workflows/
├── pdf-rag-workflow.ts              # PDF RAG処理ワークフロー
└── weather-workflow.ts              # 天気情報ワークフロー
```

### src/mastra/agents/（エージェント）

```
agents/
├── pdf-agent.ts                     # PDF処理エージェント
└── weather-agent.ts                 # 天気情報エージェント
```

### src/mastra/tools/（ツール）

```
tools/
├── github-repo-search-tool.ts       # GitHubリポジトリ検索ツール
├── rag-search-tool.ts               # RAG検索ツール
├── add-rag-tool.ts                  # RAG追加ツール
├── download-pdf-tool.ts             # PDFダウンロードツール
└── weather-tool.ts                  # 天気情報ツール
```

### src/mastra/integrations/（統合）

```
integrations/
└── github.ts                        # GitHub API統合
```

### src/mastra/models/（モデル）

```
models/
└── index.ts                         # モデル定義
```

## ファイルの役割と機能

### pdf-front-app 主要ファイル

- **page.tsx**: タスク管理 UI（Convex と連携）
- **layout.tsx**: アプリケーション全体のレイアウト
- **ConvexClientProvider.tsx**: Convex クライアントの設定
- **globals.css**: Tailwind CSS とカスタムスタイル
- **tasks.ts**: タスクの CRUD 操作 API

### pdf-mastra-app 主要ファイル

- **index.ts**: Mastra アプリケーションの初期化と設定
- **pdf-rag-workflow.ts**: PDF ファイルの RAG 処理ワークフロー
- **weather-workflow.ts**: 天気情報取得ワークフロー
- **pdf-agent.ts**: PDF 処理専用エージェント
- **weather-agent.ts**: 天気情報取得エージェント
- **github.ts**: GitHub API との統合

## 開発・ビルド関連

### 開発環境

- **package.json**: 依存関係とスクリプト定義
- **tsconfig.json**: TypeScript コンパイラ設定
- **eslint.config.mjs**: コード品質管理
- **next.config.ts**: Next.js 設定
- **postcss.config.mjs**: CSS 処理設定

### データベース・ストレージ

- **convex/\_generated/**: Convex 自動生成ファイル
- **.mastra/mastra.db**: LibSQL データベースファイル

### 静的リソース

- **public/**: 画像、アイコン等の静的ファイル
- **favicon.ico**: ブラウザタブアイコン

## 命名規則

### ファイル命名

- **React コンポーネント**: PascalCase（例：ConvexClientProvider.tsx）
- **API・ツール**: kebab-case（例：github-repo-search-tool.ts）
- **ワークフロー・エージェント**: kebab-case（例：pdf-rag-workflow.ts）
- **設定ファイル**: 標準名（例：package.json, tsconfig.json）

### ディレクトリ命名

- **機能別**: workflows/, agents/, tools/, integrations/
- **フレームワーク標準**: src/, public/, convex/
- **設定**: .cursor/, .mastra/

## 注意事項

- **.git/**: Git リポジトリ管理（通常は非表示）
- **node_modules/**: 依存関係（通常は非表示）
- **.next/**: Next.js ビルド出力（通常は非表示）
- **.mastra/**: Mastra 設定・データ（バージョン管理対象外）
- **\_generated/**: Convex 自動生成ファイル（編集禁止）
