"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
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
import { getCurrentUser } from "@/lib/auth";
import {
  assistantReply,
  avatarOptions,
  captionIdeas,
  lyricMatches,
  mixAdvice,
  thumbnailIdeas,
  videoIdeas,
} from "@/lib/ai";
import { getChallenges, getGroups, getProjects, getTrends } from "@/lib/data";
import type { GeneratedCaption, GeneratedIdea, GeneratedThumbnail } from "@/lib/types";

export type ActionResult = { ok: boolean; error?: string; xpAwarded?: number; message?: string };

async function me() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  return user;
}

function touch(paths: string[]) {
  for (const path of paths) revalidatePath(path);
}

async function grantXp(userId: number, amount: number) {
  const [updated] = await db
    .update(users)
    .set({ xp: sql`${users.xp} + ${amount}` })
    .where(eq(users.id, userId))
    .returning({ xp: users.xp });

  const eligible = await db.select({ id: badges.id }).from(badges).where(sql`${badges.xpRequired} <= ${updated.xp}`);
  if (eligible.length > 0) {
    await db
      .insert(userBadges)
      .values(eligible.map((badge) => ({ userId, badgeId: badge.id })))
      .onConflictDoNothing();
  }
  touch(["/dashboard", "/quests"]);
  return updated.xp;
}

/* ---------------- projects ---------------- */

export type ProjectInput = {
  title: string;
  kind: "music" | "creator";
  description?: string;
  bpm?: number;
  tone?: string;
  vocalStyle?: string;
  lyrics?: string;
  caption?: string;
  emoji?: string;
  gradient?: string;
  status?: string;
};

export async function createProject(input: ProjectInput): Promise<ActionResult> {
  const user = await me();
  const title = input.title.trim();
  if (!title) return { ok: false, error: "Give your project a name first." };

  await db.insert(projects).values({
    userId: user.id,
    title,
    kind: input.kind,
    description: input.description ?? "",
    bpm: input.bpm ?? 120,
    tone: input.tone ?? "midnight",
    vocalStyle: input.vocalStyle ?? "airy",
    lyrics: input.lyrics ?? "",
    caption: input.caption ?? "",
    emoji: input.emoji ?? (input.kind === "music" ? "🎧" : "✨"),
    gradient: input.gradient ?? "linear-gradient(135deg,#8b5cf6,#22d3ee)",
    status: input.status ?? "draft",
    progress: input.status === "published" ? 100 : 10,
  });

  await grantXp(user.id, 15);
  touch(["/music", "/creator", "/dashboard", "/offline"]);
  return { ok: true, message: "Project created", xpAwarded: 15 };
}

export async function updateProject(id: number, input: Partial<ProjectInput> & { savedOffline?: boolean; progress?: number }): Promise<ActionResult> {
  const user = await me();
  if (input.title !== undefined && !input.title.trim()) return { ok: false, error: "Title cannot be empty." };

  await db
    .update(projects)
    .set({
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.bpm !== undefined ? { bpm: input.bpm } : {}),
      ...(input.tone !== undefined ? { tone: input.tone } : {}),
      ...(input.vocalStyle !== undefined ? { vocalStyle: input.vocalStyle } : {}),
      ...(input.lyrics !== undefined ? { lyrics: input.lyrics } : {}),
      ...(input.caption !== undefined ? { caption: input.caption } : {}),
      ...(input.emoji !== undefined ? { emoji: input.emoji } : {}),
      ...(input.gradient !== undefined ? { gradient: input.gradient } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.savedOffline !== undefined ? { savedOffline: input.savedOffline } : {}),
      ...(input.progress !== undefined ? { progress: Math.max(0, Math.min(100, input.progress)) } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(projects.id, id), eq(projects.userId, user.id)));

  touch(["/music", "/creator", "/dashboard", "/offline"]);
  return { ok: true, message: "Saved" };
}

export async function deleteProject(id: number): Promise<ActionResult> {
  const user = await me();
  await db.delete(projects).where(and(eq(projects.id, id), eq(projects.userId, user.id)));
  touch(["/music", "/creator", "/dashboard", "/offline"]);
  return { ok: true, message: "Project deleted" };
}

export async function toggleProjectOffline(id: number): Promise<ActionResult> {
  const user = await me();
  await db
    .update(projects)
    .set({ savedOffline: sql`not ${projects.savedOffline}`, updatedAt: new Date() })
    .where(and(eq(projects.id, id), eq(projects.userId, user.id)));
  touch(["/music", "/creator", "/offline"]);
  return { ok: true };
}

export async function publishProject(id: number): Promise<ActionResult> {
  const user = await me();
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, user.id)))
    .limit(1);
  if (!project) return { ok: false, error: "Project not found." };

  await db.insert(posts).values({
    userId: user.id,
    caption: project.caption || `${project.title} — ${project.description || "a new creation from the studio."}`,
    mediaKind: project.kind === "music" ? "audio" : "art",
    gradient: project.gradient,
    emoji: project.emoji,
    tags: [project.kind === "music" ? "newmusic" : "newdrop", project.tone.replace(/\s+/g, "")],
    likeCount: 0,
    commentCount: 0,
  });

  await db
    .update(projects)
    .set({ status: "published", progress: 100, updatedAt: new Date() })
    .where(eq(projects.id, id));

  await grantXp(user.id, 60);
  touch(["/feed", "/dashboard", "/music", "/creator", "/community"]);
  return { ok: true, message: "Published to your feed", xpAwarded: 60 };
}

export async function remixTrend(trendId: number): Promise<ActionResult> {
  const user = await me();
  const [trend] = await db.select().from(trends).where(eq(trends.id, trendId)).limit(1);
  if (!trend) return { ok: false, error: "Trend not found." };

  await db.insert(projects).values({
    userId: user.id,
    title: `${trend.title} (my flip)`,
    kind: trend.kind === "creator" ? "creator" : "music",
    description: `Remix seed from trending: ${trend.subtitle}.`,
    bpm: 118 + (trend.score % 24),
    tone: trend.tags[0] ?? "midnight",
    vocalStyle: "airy",
    emoji: trend.emoji,
    gradient: trend.gradient,
    status: "draft",
    progress: 12,
  });

  await grantXp(user.id, 20);
  touch(["/music", "/creator", "/discover", "/dashboard"]);
  return { ok: true, message: "Remix started in Music Studio", xpAwarded: 20 };
}

/* ---------------- posts & social ---------------- */

export async function createPost(input: {
  caption: string;
  mediaKind?: string;
  tags?: string[];
  emoji?: string;
  gradient?: string;
}): Promise<ActionResult> {
  const user = await me();
  const caption = input.caption.trim();
  if (!caption) return { ok: false, error: "Write something first." };

  await db.insert(posts).values({
    userId: user.id,
    caption,
    mediaKind: input.mediaKind ?? "art",
    tags: input.tags ?? [],
    emoji: input.emoji ?? "✨",
    gradient: input.gradient ?? "linear-gradient(135deg,#8b5cf6,#ec4899)",
  });

  await grantXp(user.id, 20);
  touch(["/feed", "/dashboard", "/community"]);
  return { ok: true, message: "Posted to your feed", xpAwarded: 20 };
}

export async function updatePost(id: number, input: { caption: string; tags?: string[] }): Promise<ActionResult> {
  const user = await me();
  if (!input.caption.trim()) return { ok: false, error: "Caption cannot be empty." };
  await db
    .update(posts)
    .set({ caption: input.caption.trim(), ...(input.tags ? { tags: input.tags } : {}) })
    .where(and(eq(posts.id, id), eq(posts.userId, user.id)));
  touch(["/feed", "/dashboard"]);
  return { ok: true, message: "Post updated" };
}

export async function deletePost(id: number): Promise<ActionResult> {
  const user = await me();
  await db.delete(posts).where(and(eq(posts.id, id), eq(posts.userId, user.id)));
  touch(["/feed", "/dashboard"]);
  return { ok: true, message: "Post deleted" };
}

export async function toggleReaction(postId: number): Promise<ActionResult & { reacted?: boolean; likeCount?: number }> {
  const user = await me();
  const [existing] = await db
    .select()
    .from(reactions)
    .where(and(eq(reactions.postId, postId), eq(reactions.userId, user.id)))
    .limit(1);

  if (existing) {
    await db.delete(reactions).where(eq(reactions.id, existing.id));
    const [updated] = await db
      .update(posts)
      .set({ likeCount: sql`greatest(${posts.likeCount} - 1, 0)` })
      .where(eq(posts.id, postId))
      .returning({ likeCount: posts.likeCount });
    touch(["/feed", "/dashboard"]);
    return { ok: true, reacted: false, likeCount: updated.likeCount };
  }

  await db.insert(reactions).values({ postId, userId: user.id, emoji: "🔥" });
  const [updated] = await db
    .update(posts)
    .set({ likeCount: sql`${posts.likeCount} + 1` })
    .where(eq(posts.id, postId))
    .returning({ likeCount: posts.likeCount });
  touch(["/feed", "/dashboard"]);
  return { ok: true, reacted: true, likeCount: updated.likeCount };
}

export async function addComment(postId: number, body: string): Promise<ActionResult> {
  const user = await me();
  if (!body.trim()) return { ok: false, error: "Comment cannot be empty." };

  await db.insert(comments).values({ postId, userId: user.id, body: body.trim() });
  await db.update(posts).set({ commentCount: sql`${posts.commentCount} + 1` }).where(eq(posts.id, postId));
  await grantXp(user.id, 5);
  touch(["/feed", "/dashboard", "/community"]);
  return { ok: true, message: "+5 XP for joining the conversation", xpAwarded: 5 };
}

export async function deleteComment(id: number): Promise<ActionResult> {
  const user = await me();
  const [comment] = await db.select().from(comments).where(eq(comments.id, id)).limit(1);
  if (!comment || comment.userId !== user.id) return { ok: false, error: "You can only delete your own comments." };
  await db.delete(comments).where(eq(comments.id, id));
  await db
    .update(posts)
    .set({ commentCount: sql`greatest(${posts.commentCount} - 1, 0)` })
    .where(eq(posts.id, comment.postId));
  touch(["/feed"]);
  return { ok: true, message: "Comment deleted" };
}

/* ---------------- community ---------------- */

export async function toggleGroupMembership(groupId: number): Promise<ActionResult & { joined?: boolean }> {
  const user = await me();
  const [existing] = await db
    .select()
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, user.id)))
    .limit(1);

  if (existing) {
    await db.delete(groupMembers).where(eq(groupMembers.id, existing.id));
    await db
      .update(groups)
      .set({ memberCount: sql`greatest(${groups.memberCount} - 1, 0)` })
      .where(eq(groups.id, groupId));
    touch(["/community", "/dashboard"]);
    return { ok: true, joined: false, message: "Left the group" };
  }

  await db.insert(groupMembers).values({ groupId, userId: user.id });
  await db.update(groups).set({ memberCount: sql`${groups.memberCount} + 1` }).where(eq(groups.id, groupId));
  await grantXp(user.id, 10);
  touch(["/community", "/dashboard"]);
  return { ok: true, joined: true, message: "+10 XP — welcome to the group", xpAwarded: 10 };
}

/* ---------------- gamification ---------------- */

export async function completeChallenge(challengeId: number): Promise<ActionResult> {
  const user = await me();
  const [challenge] = await db.select().from(challenges).where(eq(challenges.id, challengeId)).limit(1);
  if (!challenge) return { ok: false, error: "Challenge not found." };

  const [existing] = await db
    .select()
    .from(challengeCompletions)
    .where(and(eq(challengeCompletions.challengeId, challengeId), eq(challengeCompletions.userId, user.id)))
    .limit(1);
  if (existing) return { ok: false, error: "You already completed this one today." };

  await db.insert(challengeCompletions).values({ challengeId, userId: user.id });
  await db.update(challenges).set({ completions: sql`${challenges.completions} + 1` }).where(eq(challenges.id, challengeId));
  await db.update(users).set({ streak: sql`${users.streak} + 1`, lastActiveOn: new Date().toISOString().slice(0, 10) }).where(eq(users.id, user.id));
  await grantXp(user.id, challenge.xp);
  touch(["/dashboard", "/quests"]);
  return { ok: true, message: `Challenge complete +${challenge.xp} XP`, xpAwarded: challenge.xp };
}

/* ---------------- assistant ---------------- */

export async function sendAssistantMessage(prompt: string): Promise<ActionResult & { reply?: string }> {
  const user = await me();
  const clean = prompt.trim();
  if (!clean) return { ok: false, error: "Ask me something first." };

  await db.insert(assistantMessages).values({ userId: user.id, role: "user", content: clean });

  const [trendRows, challengeRows, groupRows, projectRows] = await Promise.all([
    getTrends(),
    getChallenges(user.id),
    getGroups(user.id),
    getProjects(user.id),
  ]);

  await new Promise((resolve) => setTimeout(resolve, 420));

  const reply = assistantReply(clean, user, {
    projectCount: projectRows.length,
    savedProject: projectRows[0] ?? null,
    trends: trendRows,
    challenges: challengeRows,
    groups: groupRows,
  });

  await db.insert(assistantMessages).values({ userId: user.id, role: "assistant", content: reply });
  touch(["/assistant", "/dashboard"]);
  return { ok: true, reply };
}

export async function clearAssistant(): Promise<ActionResult> {
  const user = await me();
  await db.delete(assistantMessages).where(eq(assistantMessages.userId, user.id));
  await db.insert(assistantMessages).values({
    userId: user.id,
    role: "assistant",
    content: "Fresh canvas ✨ I cleared our chat. What are we making today — a track, a caption, or a plan for your next drop?",
  });
  touch(["/assistant"]);
  return { ok: true, message: "Chat cleared" };
}

export async function generateCaption(topic: string, tone: string, interests: string[]): Promise<ActionResult & { captions?: GeneratedCaption[] }> {
  await me();
  if (!topic.trim()) return { ok: false, error: "Add a topic so I know what to write about." };
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { ok: true, captions: captionIdeas(topic, tone, interests) };
}

export async function generateThumbnails(topic: string, style: string): Promise<ActionResult & { thumbnails?: GeneratedThumbnail[] }> {
  await me();
  if (!topic.trim()) return { ok: false, error: "Describe the video or drop first." };
  await new Promise((resolve) => setTimeout(resolve, 520));
  return { ok: true, thumbnails: thumbnailIdeas(topic, style) };
}

export async function generateVideoIdeas(topic: string): Promise<ActionResult & { ideas?: GeneratedIdea[] }> {
  await me();
  if (!topic.trim()) return { ok: false, error: "Give me a topic to riff on." };
  await new Promise((resolve) => setTimeout(resolve, 480));
  return { ok: true, ideas: videoIdeas(topic) };
}

export async function generateAvatarSet(): Promise<ActionResult & { avatars?: { emoji: string; gradient: string }[] }> {
  await me();
  await new Promise((resolve) => setTimeout(resolve, 260));
  return { ok: true, avatars: avatarOptions(Math.floor(Math.random() * 40)) };
}

export async function generateLyrics(topic: string, tone: string): Promise<ActionResult & { lines?: string[] }> {
  await me();
  await new Promise((resolve) => setTimeout(resolve, 450));
  return { ok: true, lines: lyricMatches(topic, tone) };
}

export async function suggestMix(projectId: number): Promise<ActionResult & { tips?: string[] }> {
  await me();
  const user = await me();
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)))
    .limit(1);
  if (!project) return { ok: false, error: "Project not found." };
  await new Promise((resolve) => setTimeout(resolve, 350));
  return {
    ok: true,
    tips: mixAdvice({
      title: project.title,
      bpm: project.bpm,
      tone: project.tone,
      vocalStyle: project.vocalStyle,
    }),
  };
}

/* ---------------- marketplace & plans ---------------- */

export async function purchaseItem(itemId: number): Promise<ActionResult> {
  const user = await me();
  const [item] = await db.select().from(marketItems).where(eq(marketItems.id, itemId)).limit(1);
  if (!item) return { ok: false, error: "Item not found." };

  const result = await db.insert(purchases).values({ userId: user.id, itemId }).onConflictDoNothing().returning({ id: purchases.id });
  if (result.length === 0) return { ok: false, error: "You already own this." };

  await db.update(marketItems).set({ sales: sql`${marketItems.sales} + 1` }).where(eq(marketItems.id, itemId));
  await grantXp(user.id, 25);
  touch(["/marketplace", "/dashboard"]);
  return { ok: true, message: `Added to your library · +25 XP`, xpAwarded: 25 };
}

export async function changePlan(plan: string): Promise<ActionResult> {
  const user = await me();
  if (!["free", "plus", "pro"].includes(plan)) return { ok: false, error: "Unknown plan." };
  await db.update(users).set({ plan }).where(eq(users.id, user.id));
  touch(["/marketplace", "/settings", "/dashboard"]);
  return { ok: true, message: `You're now on Muse ${plan[0].toUpperCase()}${plan.slice(1)}` };
}

/* ---------------- settings & safety ---------------- */

export async function saveProfile(input: {
  name: string;
  handle: string;
  bio: string;
  interests: string[];
}): Promise<ActionResult> {
  const user = await me();
  const name = input.name.trim();
  const handle = input.handle.trim().toLowerCase().replace(/[^a-z0-9._]/g, "");
  if (name.length < 2) return { ok: false, error: "Name needs at least 2 characters." };
  if (handle.length < 3) return { ok: false, error: "Handle needs at least 3 characters (letters, numbers, dots)." };

  try {
    await db
      .update(users)
      .set({ name, handle, bio: input.bio.slice(0, 240), interests: input.interests })
      .where(eq(users.id, user.id));
  } catch {
    return { ok: false, error: "That handle is already taken." };
  }
  touch(["/settings", "/dashboard", "/community", "/feed"]);
  return { ok: true, message: "Profile updated" };
}

export async function saveAppearance(input: { theme: string; accent: string }): Promise<ActionResult> {
  const user = await me();
  await db
    .update(users)
    .set({ theme: input.theme === "light" ? "light" : "dark", accent: input.accent })
    .where(eq(users.id, user.id));
  touch(["/settings", "/dashboard"]);
  return { ok: true, message: "Look updated" };
}

export async function saveAvatar(input: { emoji: string; gradient: string }): Promise<ActionResult> {
  const user = await me();
  await db.update(users).set({ avatarEmoji: input.emoji, gradient: input.gradient }).where(eq(users.id, user.id));
  touch(["/settings", "/dashboard", "/feed"]);
  return { ok: true, message: "Avatar updated" };
}

export async function savePrivacy(input: Record<string, boolean>): Promise<ActionResult> {
  const user = await me();
  await db.update(users).set({ privacy: input }).where(eq(users.id, user.id));
  touch(["/settings"]);
  return { ok: true, message: "Privacy preferences saved" };
}

export async function toggleBlock(targetUserId: number): Promise<ActionResult & { blocked?: boolean }> {
  const user = await me();
  if (targetUserId === user.id) return { ok: false, error: "You can't block yourself." };

  const [existing] = await db
    .select()
    .from(blocks)
    .where(and(eq(blocks.userId, user.id), eq(blocks.blockedUserId, targetUserId)))
    .limit(1);

  if (existing) {
    await db.delete(blocks).where(eq(blocks.id, existing.id));
    touch(["/settings", "/community", "/discover", "/feed"]);
    return { ok: true, blocked: false, message: "User unblocked" };
  }

  await db.insert(blocks).values({ userId: user.id, blockedUserId: targetUserId });
  touch(["/settings", "/community", "/discover", "/feed"]);
  return { ok: true, blocked: true, message: "User blocked — their content is hidden" };
}

export async function createReport(input: { target: string; reason: string }): Promise<ActionResult> {
  const user = await me();
  if (!input.target.trim() || !input.reason.trim()) return { ok: false, error: "Tell us who and what happened." };
  await db.insert(reports).values({ userId: user.id, target: input.target.trim(), reason: input.reason.trim() });
  touch(["/settings"]);
  return { ok: true, message: "Report sent to moderation" };
}
