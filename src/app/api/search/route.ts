import { desc, ilike, or, eq, and } from "drizzle-orm";
import { db } from "@/db";
import { groups, posts, projects, trends, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const TOOLS = [
  { label: "Vocal tuner", href: "/music", emoji: "🎙️", description: "Pitch, formant and tone shaping" },
  { label: "Lyric matcher", href: "/music", emoji: "📝", description: "Find lines that fit your beat" },
  { label: "Caption lab", href: "/creator", emoji: "💬", description: "Captions and hashtags in your voice" },
  { label: "Thumbnail forge", href: "/creator", emoji: "🖼️", description: "Covers built for click-through" },
  { label: "Avatar maker", href: "/creator", emoji: "🪩", description: "Gradient avatars, zero design skills" },
  { label: "Short-video ideas", href: "/creator", emoji: "🎬", description: "Hooks, formats and 15s beats" },
  { label: "Daily challenges", href: "/quests", emoji: "⚡", description: "Earn XP and keep the streak" },
  { label: "Offline projects", href: "/offline", emoji: "📥", description: "Saved work, no wifi needed" },
  { label: "Privacy controls", href: "/settings", emoji: "🛡️", description: "Blocking, reporting and visibility" },
];

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const q = (new URL(request.url).searchParams.get("q") ?? "").trim();
  const tools = q
    ? TOOLS.filter((tool) => `${tool.label} ${tool.description}`.toLowerCase().includes(q.toLowerCase()))
    : TOOLS.slice(0, 5);

  if (q.length < 2) {
    return Response.json({ query: q, posts: [], creators: [], groups: [], projects: [], trends: [], tools });
  }

  const like = `%${q}%`;

  const [postRows, creatorRows, groupRows, projectRows, trendRows] = await Promise.all([
    db
      .select({ id: posts.id, caption: posts.caption, emoji: posts.emoji, gradient: posts.gradient, name: users.name })
      .from(posts)
      .innerJoin(users, eq(users.id, posts.userId))
      .where(ilike(posts.caption, like))
      .orderBy(desc(posts.likeCount))
      .limit(4),
    db
      .select({ id: users.id, name: users.name, handle: users.handle, emoji: users.avatarEmoji, gradient: users.gradient })
      .from(users)
      .where(or(ilike(users.name, like), ilike(users.handle, like), ilike(users.bio, like)))
      .limit(4),
    db
      .select({ id: groups.id, name: groups.name, emoji: groups.emoji, gradient: groups.gradient })
      .from(groups)
      .where(or(ilike(groups.name, like), ilike(groups.description, like)))
      .limit(4),
    db
      .select({ id: projects.id, title: projects.title, emoji: projects.emoji, kind: projects.kind })
      .from(projects)
      .where(and(eq(projects.userId, user.id), ilike(projects.title, like)))
      .limit(4),
    db
      .select({ id: trends.id, title: trends.title, emoji: trends.emoji, kind: trends.kind })
      .from(trends)
      .where(or(ilike(trends.title, like), ilike(trends.subtitle, like)))
      .limit(4),
  ]);

  return Response.json({
    query: q,
    posts: postRows,
    creators: creatorRows,
    groups: groupRows,
    projects: projectRows,
    trends: trendRows,
    tools,
  });
}
