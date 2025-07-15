import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    tokenIdentifier: v.string(),
    clerkUserId: v.string(),
    tokenUsageByMonth: v.optional(v.record(v.string(), v.number())), // 月ごとのトークン数
    stripeCustomerId: v.optional(v.string()), // Stripe顧客ID
    hasCard: v.optional(v.boolean()), // クレカ登録済みか
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_clerkUserId", ["clerkUserId"]),
  pdfs: defineTable({
    userId: v.id("users"),
    fileName: v.string(),
    storageId: v.string(),
    createdAt: v.number(),
    ragSummary: v.optional(v.string()),
    ragKeywords: v.optional(v.array(v.string())),
    ragEmbedding: v.optional(v.array(v.float64())),
    lastRagUpdatedAt: v.optional(v.number()),
  }).index("by_user", ["userId"]),
  threads: defineTable({
    title: v.string(),
    userId: v.id("users"),
    pdfId: v.id("pdfs"),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_pdf", ["userId", "pdfId"]),
  messages: defineTable({
    threadId: v.id("threads"),
    userId: v.string(),
    text: v.string(),
    createdAt: v.number(),
  }).index("by_thread", ["threadId"]),
});
