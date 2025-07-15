import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

// 一時アップロードURL発行
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("認証が必要です");
    return await ctx.storage.generateUploadUrl();
  },
});

// PDF保存
export const savePdf = mutation({
  args: {
    storageId: v.string(),
    fileName: v.string(),
  },
  handler: async (ctx, args) => {
    console.log("[savePdf] called", {
      fileName: args.fileName,
      storageId: args.storageId,
    });
    console.log(process.env);

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("認証が必要です");
    // ユーザー取得
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();
    if (!user) throw new Error("ユーザーが見つかりません");
    // DBに保存
    const id = await ctx.db.insert("pdfs", {
      userId: user._id,
      fileName: args.fileName,
      storageId: args.storageId,
      createdAt: Date.now(),
    });
    console.log("[savePdf] PDF saved in DB", { id });
    // Convex Storageの署名付きURLを取得
    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) throw new Error("署名付きURLの取得に失敗しました");
    // Mastra Workflow APIをActionで非同期スケジューリング
    console.log("[savePdf] callMastraWorkflow", { url, pdfId: id });
    await ctx.scheduler.runAfter(0, api.actions.callMastraWorkflow, {
      url,
      pdfId: id,
    });
    console.log("[savePdf] completed", { id });
    return id;
  },
});

// RAGメタ情報を更新
export const updatePdfRagMeta = mutation({
  args: {
    pdfId: v.id("pdfs"),
    ragSummary: v.optional(v.string()),
    ragKeywords: v.optional(v.array(v.string())),
    ragEmbedding: v.optional(v.array(v.float64())),
    lastRagUpdatedAt: v.optional(v.number()),
    apiKey: v.optional(v.string()), // ← 追加
  },
  handler: async (ctx, args) => {
    // APIキー認証
    if (args.apiKey !== process.env.MASTRA_API_KEY) {
      throw new Error("APIキーが不正です");
    }
    // PDF存在チェック（必要なら所有者チェックも）
    const pdf = await ctx.db.get(args.pdfId);
    if (!pdf) throw new Error("PDFが見つかりません");

    await ctx.db.patch(args.pdfId, {
      ragSummary: args.ragSummary,
      ragKeywords: args.ragKeywords,
      ragEmbedding: args.ragEmbedding,
      lastRagUpdatedAt: args.lastRagUpdatedAt,
    });
    return args.pdfId;
  },
});

// PDF一覧取得
export const listPdfs = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("認証が必要です");
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();
    if (!user) throw new Error("ユーザーが見つかりません");
    // 自分のPDFのみ返す
    const pdfs = await ctx.db
      .query("pdfs")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
    // storageIdから署名付きURLを生成
    return await Promise.all(
      pdfs.map(async (pdf) => ({
        ...pdf,
        url: await ctx.storage.getUrl(pdf.storageId),
      }))
    );
  },
});

// スレッド作成
export const createThread = mutation({
  args: { title: v.string(), pdfId: v.id("pdfs") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("認証が必要です");
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();
    if (!user) throw new Error("ユーザーが見つかりません");
    const id = await ctx.db.insert("threads", {
      title: args.title,
      userId: user._id,
      pdfId: args.pdfId,
      createdAt: Date.now(),
    });
    return id;
  },
});

// スレッド一覧取得
export const listThreads = query({
  args: { pdfId: v.optional(v.id("pdfs")) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("認証が必要です");
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();
    if (!user) throw new Error("ユーザーが見つかりません");
    let q = ctx.db
      .query("threads")
      .withIndex("by_user", (q) => q.eq("userId", user._id));
    if (typeof args.pdfId !== "undefined") {
      return await ctx.db
        .query("threads")
        .withIndex("by_user_pdf", (q) =>
          q
            .eq("userId", user._id)
            .eq("pdfId", args.pdfId as unknown as Id<"pdfs">)
        )
        .order("desc")
        .collect();
    }
    return await q.order("desc").collect();
  },
});

// スレッド情報取得（所有権チェック付き）
export const getThreadIfOwned = query({
  args: { threadId: v.id("threads"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const thread = await ctx.db.get(args.threadId);
    if (!thread) return null;
    if (thread.userId !== args.userId) return null;
    return thread;
  },
});

// メッセージ送信
export const sendMessage = mutation({
  args: {
    threadId: v.id("threads"),
    text: v.string(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let userId: string;
    if (args.userId) {
      // AI応答など、明示的にuserIdが指定された場合
      userId = args.userId;
    } else {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) throw new Error("認証が必要です");
      const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier)
        )
        .unique();
      if (!user) throw new Error("ユーザーが見つかりません");
      userId = user._id;
    }
    const id = await ctx.db.insert("messages", {
      threadId: args.threadId,
      userId,
      text: args.text,
      createdAt: Date.now(),
    });
    return id;
  },
});

// スレッドごとのメッセージ一覧取得
export const listMessages = query({
  args: { threadId: v.id("threads") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("認証が必要です");

    // ユーザー取得
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();
    if (!user) throw new Error("ユーザーが見つかりません");

    // スレッドの所有権チェック
    const thread = await ctx.db.get(args.threadId);
    if (!thread) throw new Error("スレッドが見つかりません");
    if (thread.userId !== user._id) throw new Error("権限がありません");

    return await ctx.db
      .query("messages")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .order("asc")
      .collect();
  },
});

export const getConvexUserId = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .unique();
    return user ? user._id : null;
  },
});

export const addTokenUsageFromMastra = mutation({
  args: { userId: v.id("users"), tokens: v.number(), apiKey: v.string() },
  handler: async (ctx, args) => {
    if (args.apiKey !== process.env.MASTRA_API_KEY) {
      throw new Error("APIキーが不正です");
    }
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("ユーザーが見つかりません");
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const usage = user.tokenUsageByMonth ?? {};
    usage[ym] = (usage[ym] ?? 0) + args.tokens;
    await ctx.db.patch(args.userId, { tokenUsageByMonth: usage });
    return usage[ym];
  },
});

export const getUser = query({
  args: { userId: v.id("users"), apiKey: v.string() },
  handler: async (ctx, args) => {
    if (args.apiKey !== process.env.MASTRA_API_KEY) {
      throw new Error("APIキーが不正です");
    }
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("ユーザーが見つかりません");
    return user;
  },
});
