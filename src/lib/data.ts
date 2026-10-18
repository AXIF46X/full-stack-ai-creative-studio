import { and, desc, eq, inArray, notInArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  assistantMessages,
  badges,
  blocks,
  challenges,
  challengeCompletions,
  comments,
  groupMembers,
  groups,
  marketItems,
  posts,
  projects,
  purchases,
  reactions,
  reports,
  trends,
  userBadges,
  users,
} from "@/db/schema";
import { timeAgo } from "@/lib/format";
import type {
  AssistantMessageDTO,
  BadgeDTO,
  ChallengeDTO,
  CommentDTO,
  CreatorDTO,
  GroupDTO,
  MarketItemDTO,
  PostDTO,
  ProjectDTO,
  TrendDTO,
} from "@/lib/types";

const authorShape = {
  id: users.id,
  name: users.name,
  handle: users.handle,
  emoji: users.avatarEmoji,
  gradient: users.gradient,
};

async function blockedIds(viewerId: number) {
  const rows = await db.select({ id: blocks.blockedUserId }).from(blocks).where(eq(blocks.userId, viewerId));
  return rows.map((r) => r.id);
}

export async function getProjects(userId: number, kind?: "music" | "creator"): Promise<ProjectDTO[]> {
  const rows = await db
    .select()
    .from(projects)
    .where(kind ? and(eq(projects.userId, userId), eq(projects.kind, kind)) : eq(projects.userId, userId))
    .orderBy(desc(projects.updatedAt));

  return rows.map((row) => ({
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    updatedLabel: timeAgo(row.updatedAt),
    title: row.title,
    kind: row.kind === "creator" ? "creator" : "music",
    status: row.status,
    description: row.description,
    bpm: row.bpm,
    tone: row.tone,
    vocalStyle: row.vocalStyle,
    lyrics: row.lyrics,
    caption: row.caption,
    gradient: row.gradient,
    emoji: row.emoji,
    progress: row.progress,
    savedOffline: row.savedOffline,
  }));
}

export async function getFeed(viewerId: number): Promise<PostDTO[]> {
  const hidden = await blockedIds(viewerId);

  const rows = await db
    .select({ post: posts, author: authorShape })
    .from(posts)
    .innerJoin(users, eq(users.id, posts.userId))
    .where(hidden.length ? notInArray(posts.userId, hidden) : sql`true`)
    .orderBy(desc(posts.createdAt))
    .limit(40);

  if (rows.length === 0) return [];
  const postIds = rows.map((row) => row.post.id);

  const [commentRows, reactionRows] = await Promise.all([
    db
      .select({ comment: comments, author: authorShape })
      .from(comments)
      .innerJoin(users, eq(users.id, comments.userId))
      .where(inArray(comments.postId, postIds))
      .orderBy(comments.createdAt),
    db
      .select({ postId: reactions.postId })
      .from(reactions)
      .where(and(eq(reactions.userId, viewerId), inArray(reactions.postId, postIds))),
  ]);

  const reacted = new Set(reactionRows.map((row) => row.postId));

  return rows.map(({ post, author }) => ({
    id: post.id,
    caption: post.caption,
    mediaUrl: post.mediaUrl,
    mediaKind: post.mediaKind,
    gradient: post.gradient,
    emoji: post.emoji,
    tags: post.tags ?? [],
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    createdLabel: timeAgo(post.createdAt),
    reacted: reacted.has(post.id),
    isMine: post.userId === viewerId,
    author,
    comments: commentRows
      .filter((row) => row.comment.postId === post.id)
      .map<CommentDTO>((row) => ({
        id: row.comment.id,
        body: row.comment.body,
        createdLabel: timeAgo(row.comment.createdAt),
        isMine: row.comment.userId === viewerId,
        author: row.author,
      })),
  }));
}

export async function getGroups(userId: number): Promise<GroupDTO[]> {
  const [rows, memberships] = await Promise.all([
    db.select().from(groups).orderBy(desc(groups.memberCount)),
    db.select({ groupId: groupMembers.groupId }).from(groupMembers).where(eq(groupMembers.userId, userId)),
  ]);
  const joined = new Set(memberships.map((m) => m.groupId));
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    emoji: row.emoji,
    gradient: row.gradient,
    memberCount: row.memberCount,
    tags: row.tags ?? [],
    joined: joined.has(row.id),
  }));
}

export async function getChallenges(userId: number): Promise<ChallengeDTO[]> {
  const [rows, done] = await Promise.all([
    db.select().from(challenges).where(eq(challenges.active, true)).orderBy(desc(challenges.xp)),
    db.select({ id: challengeCompletions.challengeId }).from(challengeCompletions).where(eq(challengeCompletions.userId, userId)),
  ]);
  const completed = new Set(done.map((d) => d.id));
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    xp: row.xp,
    emoji: row.emoji,
    category: row.category,
    completions: row.completions,
    done: completed.has(row.id),
  }));
}

export async function getBadges(userId: number): Promise<BadgeDTO[]> {
  const [rows, earned] = await Promise.all([
    db.select().from(badges).orderBy(badges.xpRequired),
    db.select({ badgeId: userBadges.badgeId }).from(userBadges).where(eq(userBadges.userId, userId)),
  ]);
  const earnedSet = new Set(earned.map((e) => e.badgeId));
  return rows.map((row) => ({ ...row, earned: earnedSet.has(row.id) }));
}

export async function getTrends(): Promise<TrendDTO[]> {
  const rows = await db.select().from(trends).orderBy(desc(trends.score));
  return rows.map((row) => ({ ...row, tags: row.tags ?? [] }));
}

export async function getMarketItems(userId: number): Promise<MarketItemDTO[]> {
  const [rows, owned] = await Promise.all([
    db.select().from(marketItems).orderBy(desc(marketItems.sales)),
    db.select({ itemId: purchases.itemId }).from(purchases).where(eq(purchases.userId, userId)),
  ]);
  const ownedSet = new Set(owned.map((o) => o.itemId));
  return rows.map((row) => ({ ...row, owned: ownedSet.has(row.id) }));
}

export async function getAssistantMessages(userId: number): Promise<AssistantMessageDTO[]> {
  const rows = await db
    .select()
    .from(assistantMessages)
    .where(eq(assistantMessages.userId, userId))
    .orderBy(assistantMessages.createdAt)
    .limit(80);
  return rows.map((row) => ({
    id: row.id,
    role: row.role === "user" ? "user" : "assistant",
    content: row.content,
    createdLabel: timeAgo(row.createdAt),
  }));
}

export async function getCreators(viewerId: number): Promise<CreatorDTO[]> {
  const hidden = await blockedIds(viewerId);
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      handle: users.handle,
      emoji: users.avatarEmoji,
      gradient: users.gradient,
      bio: users.bio,
      xp: users.xp,
      isCreator: users.isCreator,
    })
    .from(users)
    .orderBy(desc(users.xp));

  return rows
    .filter((row) => row.id !== viewerId)
    .map((row) => ({
      id: row.id,
      name: row.name,
      handle: row.handle,
      emoji: row.emoji,
      gradient: row.gradient,
      bio: row.bio,
      xp: row.xp,
      blocked: hidden.includes(row.id),
    }));
}

export async function getBlockedUsers(viewerId: number) {
  const rows = await db
    .select({ id: users.id, name: users.name, handle: users.handle, emoji: users.avatarEmoji, gradient: users.gradient })
    .from(blocks)
    .innerJoin(users, eq(users.id, blocks.blockedUserId))
    .where(eq(blocks.userId, viewerId));
  return rows;
}

export async function getMyReports(viewerId: number) {
  const rows = await db
    .select()
    .from(reports)
    .where(eq(reports.userId, viewerId))
    .orderBy(desc(reports.createdAt))
    .limit(10);
  return rows.map((row) => ({ ...row, createdLabel: timeAgo(row.createdAt) }));
}

export async function getLeaderboard(limit = 6) {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      handle: users.handle,
      emoji: users.avatarEmoji,
      gradient: users.gradient,
      xp: users.xp,
      streak: users.streak,
    })
    .from(users)
    .where(eq(users.isCreator, true))
    .orderBy(desc(users.xp))
    .limit(limit);
  return rows;
}

export async function getStats(userId: number) {
  const [projectRows, postRows, challengeRows, groupRows, likeRows] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(projects).where(eq(projects.userId, userId)),
    db.select({ count: sql<number>`count(*)::int`, likes: sql<number>`coalesce(sum(${posts.likeCount}),0)::int` }).from(posts).where(eq(posts.userId, userId)),
    db.select({ count: sql<number>`count(*)::int` }).from(challengeCompletions).where(eq(challengeCompletions.userId, userId)),
    db.select({ count: sql<number>`count(*)::int` }).from(groupMembers).where(eq(groupMembers.userId, userId)),
    db.select({ sum: sql<number>`coalesce(sum(${reactions.id}),0)::int` }).from(reactions).where(eq(reactions.userId, userId)),
  ]);
  return {
    projects: projectRows[0]?.count ?? 0,
    posts: postRows[0]?.count ?? 0,
    likes: postRows[0]?.likes ?? 0,
    challenges: challengeRows[0]?.count ?? 0,
    groups: groupRows[0]?.count ?? 0,
    reactions: likeRows[0]?.sum ?? 0,
  };
}
