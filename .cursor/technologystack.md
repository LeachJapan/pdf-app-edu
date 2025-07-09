# 技術スタック

## プロジェクト概要

このプロジェクトは 2 つの主要なアプリケーションで構成されています：

1. **pdf-front-app**: Next.js ベースのフロントエンドアプリケーション
2. **pdf-mastra-app**: Mastra フレームワークベースの AI エージェントアプリケーション

## pdf-front-app（フロントエンド）

### フレームワーク・ライブラリ

- **Next.js**: 15.3.5
- **React**: 19.0.0
- **React DOM**: 19.0.0
- **TypeScript**: 5.x

### バックエンド・データベース

- **Convex**: 1.25.2
  - リアルタイムデータベース
  - サーバーレス関数
  - クエリ・ミューテーション機能

### スタイリング・UI

- **Tailwind CSS**: 4.x
- **PostCSS**: 4.x
- **Google Fonts**: Geist, Geist Mono

### 開発ツール

- **ESLint**: 9.x
- **ESLint Config Next**: 15.3.5
- **Node.js**: 20.x 以上

### 設定ファイル

- **next.config.ts**: Next.js 設定
- **tsconfig.json**: TypeScript 設定（ES2017 ターゲット）
- **postcss.config.mjs**: PostCSS 設定
- **eslint.config.mjs**: ESLint 設定

## pdf-mastra-app（AI エージェント）

### フレームワーク・ライブラリ

- **Mastra**: 0.10.8
  - AI エージェントフレームワーク
  - ワークフロー管理
  - エージェント管理

### AI・機械学習

- **@ai-sdk/openai**: 1.3.22
- **@ai-sdk/google**: 1.2.19
- **@mastra/rag**: 1.0.1（RAG 機能）
- **@mastra/memory**: 0.11.0（メモリ管理）
- **@mastra/evals**: 0.10.5（評価機能）

### データベース・ストレージ

- **@mastra/libsql**: 0.11.0
  - LibSQL ベースのストレージ
  - テレメトリ、評価データの保存

### インテグレーション

- **@mastra/github**: 1.2.4
  - GitHub 統合機能

### PDF 処理

- **pdfjs-dist**: 5.1.91
  - PDF ファイルの解析・処理

### 開発ツール

- **TypeScript**: 5.8.3
- **Node.js**: 20.9.0 以上
- **Zod**: 3.25.67（型検証）

### 設定ファイル

- **tsconfig.json**: TypeScript 設定（ES2022 ターゲット）

## 共通技術要素

### 言語・プラットフォーム

- **TypeScript**: 両プロジェクトで使用
- **Node.js**: 20.x 以上
- **ES Modules**: pdf-mastra-app で使用

### 開発環境

- **TypeScript**: 厳密な型チェック
- **ESLint**: コード品質管理
- **モジュール解決**: bundler 方式

## アーキテクチャ

### pdf-front-app

- **App Router**: Next.js 15 の App Router
- **Convex 統合**: リアルタイムデータベース
- **Tailwind CSS**: ユーティリティファースト CSS
- **Google Fonts**: システムフォント

### pdf-mastra-app

- **Mastra フレームワーク**: AI エージェント管理
- **ワークフロー**: 天気情報、PDF RAG 処理
- **エージェント**: 天気、PDF 処理エージェント
- **ツール**: PDF ダウンロード、RAG 検索、GitHub 検索
- **インテグレーション**: GitHub API

## バージョン制約

### 固定バージョン

- **Next.js**: 15.3.5
- **React**: 19.0.0
- **Convex**: 1.25.2
- **Mastra**: 0.10.8

### 推奨バージョン範囲

- **TypeScript**: 5.x
- **Node.js**: 20.x 以上
- **Tailwind CSS**: 4.x

## 開発・デプロイ

### 開発コマンド

- **pdf-front-app**: `npm run dev` (Turbopack 使用)
- **pdf-mastra-app**: `mastra dev`

### ビルド・デプロイ

- **pdf-front-app**: `npm run build`
- **pdf-mastra-app**: `mastra build`

## 注意事項

- バージョン変更は承認が必要
- UI/UX デザイン変更は事前承認必須
- 技術スタックの変更は慎重に検討
- 重複実装の防止を徹底
