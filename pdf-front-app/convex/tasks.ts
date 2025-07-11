import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// 一時アップロードURL発行
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
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
    return id;
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
