import {
  boolean,
  date,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  handle: text("handle").notNull().unique(),
  bio: text("bio").notNull().default(""),
  avatarEmoji: text("avatar_emoji").notNull().default("🦋"),
  gradient: text("gradient").notNull().default("linear-gradient(135deg,#8b5cf6,#ec4899)"),
  plan: text("plan").notNull().default("free"),
  xp: integer("xp").notNull().default(0),
  streak: integer("streak").notNull().default(1),
  isCreator: boolean("is_creator").notNull().default(false),
  interests: jsonb("interests").$type<string[]>().notNull().default([]),
  theme: text("theme").notNull().default("dark"),
  accent: text("accent").notNull().default("violet"),
  privacy: jsonb("privacy").$type<Record<string, boolean>>().notNull().default({}),
  lastActiveOn: date("last_active_on"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  kind: text("kind").notNull().default("music"),
  status: text("status").notNull().default("draft"),
  description: text("description").notNull().default(""),
  bpm: integer("bpm").notNull().default(120),
  tone: text("tone").notNull().default("midnight"),
  vocalStyle: text("vocal_style").notNull().default("airy"),
  lyrics: text("lyrics").notNull().default(""),
  caption: text("caption").notNull().default(""),
  gradient: text("gradient").notNull().default("linear-gradient(135deg,#8b5cf6,#22d3ee)"),
  emoji: text("emoji").notNull().default("🎧"),
  progress: integer("progress").notNull().default(10),
  savedOffline: boolean("saved_offline").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  caption: text("caption").notNull(),
  mediaUrl: text("media_url"),
  mediaKind: text("media_kind").notNull().default("art"),
  gradient: text("gradient").notNull().default("linear-gradient(135deg,#8b5cf6,#ec4899)"),
  emoji: text("emoji").notNull().default("✨"),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  likeCount: integer("like_count").notNull().default(0),
  commentCount: integer("comment_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reactions = pgTable(
  "reactions",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    emoji: text("emoji").notNull().default("🔥"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("reactions_post_user_idx").on(table.postId, table.userId)],
);

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  emoji: text("emoji").notNull().default("🌐"),
  gradient: text("gradient").notNull().default("linear-gradient(135deg,#8b5cf6,#22d3ee)"),
  memberCount: integer("member_count").notNull().default(0),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
});

export const groupMembers = pgTable(
  "group_members",
  {
    id: serial("id").primaryKey(),
    groupId: integer("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("group_members_group_user_idx").on(table.groupId, table.userId)],
);

export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  xp: integer("xp").notNull().default(50),
  emoji: text("emoji").notNull().default("⚡"),
  category: text("category").notNull().default("creative"),
  completions: integer("completions").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const challengeCompletions = pgTable(
  "challenge_completions",
  {
    id: serial("id").primaryKey(),
    challengeId: integer("challenge_id")
      .notNull()
      .references(() => challenges.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("challenge_completions_idx").on(table.challengeId, table.userId)],
);

export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  emoji: text("emoji").notNull(),
  description: text("description").notNull(),
  xpRequired: integer("xp_required").notNull().default(0),
});

export const userBadges = pgTable(
  "user_badges",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    badgeId: integer("badge_id")
      .notNull()
      .references(() => badges.id, { onDelete: "cascade" }),
    earnedAt: timestamp("earned_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("user_badges_idx").on(table.userId, table.badgeId)],
);

export const assistantMessages = pgTable("assistant_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("assistant"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const trends = pgTable("trends", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull(),
  kind: text("kind").notNull().default("music"),
  score: integer("score").notNull().default(50),
  delta: integer("delta").notNull().default(0),
  emoji: text("emoji").notNull().default("🎵"),
  gradient: text("gradient").notNull().default("linear-gradient(135deg,#8b5cf6,#22d3ee)"),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
});

export const marketItems = pgTable("market_items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  creator: text("creator").notNull(),
  category: text("category").notNull().default("template"),
  price: integer("price").notNull().default(0),
  emoji: text("emoji").notNull().default("🎛️"),
  gradient: text("gradient").notNull().default("linear-gradient(135deg,#8b5cf6,#ec4899)"),
  rating: text("rating").notNull().default("4.9"),
  sales: integer("sales").notNull().default(0),
});

export const purchases = pgTable(
  "purchases",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    itemId: integer("item_id")
      .notNull()
      .references(() => marketItems.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("purchases_user_item_idx").on(table.userId, table.itemId)],
);

export const blocks = pgTable(
  "blocks",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    blockedUserId: integer("blocked_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("blocks_user_blocked_idx").on(table.userId, table.blockedUserId)],
);

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  target: text("target").notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
