import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    tokenIdentifier: v.string(),
  }).index("by_token", ["tokenIdentifier"]),
  pdfs: defineTable({
    userId: v.id("users"),
    fileName: v.string(),
    storageId: v.string(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
});
