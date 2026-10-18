import Link from "next/link";
import { ChallengeCard } from "@/components/challenge-card";
import {
  ArrowRightIcon,
  FlameIcon,
  MusicIcon,
  PlusIcon,
  SparklesIcon,
  TrendingUpIcon,
  TrophyIcon,
  WandIcon,
  ZapIcon,
} from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { PostCard } from "@/components/post-card";
import { Avatar } from "@/components/ui";
import { dailyBriefing, recommendationCards } from "@/lib/ai";
import { requireUser } from "@/lib/auth";
import { getBadges, getChallenges, getFeed, getProjects, getStats, getTrends } from "@/lib/data";
import { compactNumber, levelInfo } from "@/lib/format";

export const metadata = { title: "Home · muse." };

export default async function DashboardPage() {
  const user = await requireUser();
  const [projects, challenges, trends, badges, feed, stats] = await Promise.all([
    getProjects(user.id),
    getChallenges(user.id),
    getTrends(),
    getBadges(user.id),
    getFeed(user.id),
    getStats(user.id),
  ]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const { level, percent, toNext } = levelInfo(user.xp);
  const recommendations = recommendationCards(user, trends);
  const briefing = dailyBriefing(user, trends);
  const earnedBadges = badges.filter((badge) => badge.earned);
  const openChallenges = challenges.filter((challenge) => !challenge.done).slice(0, 3);
  const recentProjects = projects.slice(0, 3);
  const myPosts = feed.filter((post) => post.isMine).length;

  const statCards = [
    { label: "Projects", value: stats.projects, sub: `${projects.filter((project) => project.savedOffline).length} saved offline`, icon: "🎛️", href: "/music" },
    { label: "Total XP", value: compactNumber(user.xp), sub: `${toNext} to level ${level + 1}`, icon: "⚡", href: "/quests" },
    { label: "Reactions", value: compactNumber(stats.likes), sub: `across ${stats.posts} posts`, icon: "🔥", href: "/feed" },
    { label: "Community", value: stats.groups, sub: "groups joined", icon: "🫂", href: "/community" },
  ];

  return (
    <div>
      <PageHeader
        eyebrow={new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        title={`${greeting}, ${user.name.split(" ")[0]} 👋`}
        description="Your studio is warm, your streak is alive. Here's what Muse thinks you should do next."
        actions={
          <>
            <Link href="/music" className="btn btn-primary btn-sm">
              <PlusIcon size={14} /> New project
            </Link>
            <Link href="/assistant" className="btn btn-secondary btn-sm">
              <SparklesIcon size={14} /> Ask Muse
            </Link>
          </>
        }
      />

      <section
        className="surface noise relative mb-4 overflow-hidden p-5"
        style={{ backgroundImage: "linear-gradient(130deg, var(--accent-soft), transparent 65%)" }}
      >
        <div className="relative grid gap-4 lg:grid-cols-[1.5fr_1fr] lg:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="chip" style={{ color: "var(--accent)", borderColor: "color-mix(in srgb, var(--accent) 40%, transparent)" }}>
                <SparklesIcon size={12} /> Muse daily briefing
              </span>
              <span className="chip" style={{ color: "#fb923c", borderColor: "rgba(251,146,60,0.35)" }}>
                <FlameIcon size={12} /> {user.streak}-day streak
              </span>
            </div>
            <p className="font-display mt-3 max-w-xl text-lg leading-snug font-semibold">{briefing}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/creator" className="btn btn-secondary btn-sm">
                <WandIcon size={14} /> Generate a caption
              </Link>
              <Link href="/discover" className="btn btn-secondary btn-sm">
                <TrendingUpIcon size={14} /> Ride a trend
              </Link>
              <Link href="/quests" className="btn btn-ghost btn-sm">
                <TrophyIcon size={14} /> Earn {openChallenges[0]?.xp ?? 60} XP
              </Link>
            </div>
          </div>
          <div className="surface-2 p-4">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span>Level {level}</span>
              <span className="muted">{user.xp} XP</span>
            </div>
            <div className="progress mt-2">
              <span style={{ width: `${percent}%` }} />
            </div>
            <div className="muted mt-2 flex items-center justify-between text-[11px]">
              <span>{toNext} XP to level {level + 1}</span>
              <span className="capitalize">{user.plan} plan</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              {badges.slice(0, 6).map((badge) => (
                <span
                  key={badge.id}
                  title={`${badge.name} — ${badge.earned ? "earned" : `${badge.xpRequired} XP`}`}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-xs"
                  style={{
                    background: badge.earned ? "var(--accent-soft)" : "var(--panel-3)",
                    opacity: badge.earned ? 1 : 0.45,
                    filter: badge.earned ? "none" : "grayscale(1)",
                  }}
                >
                  {badge.emoji}
                </span>
              ))}
              <Link href="/quests" className="muted ml-auto text-[11px] font-semibold">
                {earnedBadges.length}/{badges.length} badges →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.label} href={stat.href} className="surface hover-lift p-3.5">
            <div className="flex items-start justify-between">
              <span className="muted text-[11px] font-bold tracking-wider uppercase">{stat.label}</span>
              <span className="text-base">{stat.icon}</span>
            </div>
            <p className="font-display mt-1.5 text-2xl font-bold">{stat.value}</p>
            <p className="muted text-[11px]">{stat.sub}</p>
          </Link>
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <div className="space-y-4">
          <section className="surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="font-display text-base font-bold">Muse's picks for you</h2>
                <p className="muted text-xs">Based on your {user.interests.slice(0, 2).join(" + ")} interests</p>
              </div>
              <Link href="/assistant" className="muted text-[11px] font-semibold">Open assistant →</Link>
            </div>
            <div className="space-y-2">
              {recommendations.map((rec) => (
                <div key={rec.title} className="surface-2 flex items-start gap-3 p-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm" style={{ background: "var(--accent-soft)" }}>
                    {rec.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{rec.title}</p>
                    <p className="muted mt-0.5 text-xs leading-relaxed">{rec.body}</p>
                  </div>
                  <Link href={rec.href} className="btn btn-secondary btn-sm shrink-0">
                    {rec.action} <ArrowRightIcon size={12} />
                  </Link>
                </div>
              ))}
            </div>
          </section>

          <section className="surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-base font-bold">Back to the studio</h2>
              <Link href="/music" className="muted text-[11px] font-semibold">All projects →</Link>
            </div>
            {recentProjects.length === 0 ? (
              <div className="surface-2 p-4 text-center">
                <p className="text-2xl">🎛️</p>
                <p className="mt-1 text-sm font-semibold">No projects yet</p>
                <p className="muted text-xs">Start with a 4-bar idea — it takes 60 seconds.</p>
                <Link href="/music" className="btn btn-primary btn-sm mt-2">
                  <PlusIcon size={13} /> New project
                </Link>
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-3">
                {recentProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={project.kind === "music" ? "/music" : "/creator"}
                    className="surface-2 hover-lift block overflow-hidden"
                  >
                    <div className="flex h-16 items-center justify-center text-2xl" style={{ backgroundImage: project.gradient }}>
                      {project.emoji}
                    </div>
                    <div className="p-2.5">
                      <p className="truncate text-xs font-semibold">{project.title}</p>
                      <p className="muted text-[10px] capitalize">{project.status.replace("_", " ")} · {project.updatedLabel}</p>
                      <div className="progress mt-1.5">
                        <span style={{ width: `${project.progress}%` }} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-display text-base font-bold">From your feed</h2>
              <Link href="/feed" className="muted text-[11px] font-semibold">Open feed →</Link>
            </div>
            <div className="space-y-3">
              {feed.slice(0, 2).map((post) => (
                <PostCard key={post.id} post={post} viewer={user} dense />
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <section className="surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="font-display text-base font-bold">Today's challenges</h2>
                <p className="muted text-xs">Small reps, real XP</p>
              </div>
              <Link href="/quests" className="muted text-[11px] font-semibold">All →</Link>
            </div>
            {openChallenges.length === 0 ? (
              <div className="surface-2 p-3 text-center">
                <p className="text-lg">🏁</p>
                <p className="mt-1 text-xs font-semibold">All done today. Respect.</p>
                <p className="muted text-[11px]">New challenges drop at midnight.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {openChallenges.map((challenge) => (
                  <ChallengeCard key={challenge.id} challenge={challenge} compact />
                ))}
              </div>
            )}
          </section>

          <section className="surface p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-display text-base font-bold">Trending now</h2>
              <Link href="/discover" className="muted text-[11px] font-semibold">Discover →</Link>
            </div>
            <div className="space-y-1.5">
              {trends.slice(0, 5).map((trend) => (
                <Link key={trend.id} href="/discover" className="flex items-center gap-2.5 rounded-xl px-1 py-1.5 transition hover:brightness-110">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg text-sm" style={{ backgroundImage: trend.gradient }}>
                    {trend.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">{trend.title}</p>
                    <p className="muted truncate text-[10px]">{trend.subtitle}</p>
                  </div>
                  <span className="text-[11px] font-bold" style={{ color: trend.delta > 0 ? "#4ade80" : "var(--muted)" }}>
                    +{trend.delta}%
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section className="surface p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-display text-base font-bold">Your circle</h2>
              <Link href="/community" className="muted text-[11px] font-semibold">Community →</Link>
            </div>
            <div className="muted text-xs">
              You've posted <span className="font-semibold" style={{ color: "var(--text)" }}>{myPosts}</span> times and given{" "}
              <span className="font-semibold" style={{ color: "var(--text)" }}>{stats.reactions}</span> reactions. Communities reply
              fastest in the first hour — drop something today.
            </div>
            <Link href="/community" className="btn btn-secondary btn-sm mt-2 w-full">
              Find your people
            </Link>
          </section>

          {user.plan === "free" ? (
            <section className="surface p-4" style={{ backgroundImage: "linear-gradient(140deg, var(--accent-soft), transparent)" }}>
              <p className="flex items-center gap-1.5 text-xs font-bold"><ZapIcon size={14} /> Unlock unlimited projects</p>
              <p className="muted mt-1 text-xs">
                Muse Plus adds stem separation, HD thumbnails and offline packs for $8/mo.
              </p>
              <Link href="/marketplace" className="btn btn-primary btn-sm mt-2 w-full">
                Compare plans
              </Link>
            </section>
          ) : (
            <section className="surface p-4">
              <p className="flex items-center gap-1.5 text-xs font-bold"><MusicIcon size={14} /> {user.plan} perk</p>
              <p className="muted mt-1 text-xs">Priority AI + HD exports are active. Try a stem split on your latest draft.</p>
              <Link href="/music" className="btn btn-secondary btn-sm mt-2 w-full">Open Music Studio</Link>
            </section>
          )}

          <section className="surface p-4">
            <h2 className="font-display mb-2 text-base font-bold">Top creators this week</h2>
            <div className="space-y-2">
              {[...new Map(feed.map((post) => [post.author.id, post.author])).values()].slice(0, 4).map((author) => (
                <div key={author.id} className="flex items-center gap-2">
                  <Avatar emoji={author.emoji} gradient={author.gradient} size={28} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">{author.name}</p>
                    <p className="muted text-[10px]">@{author.handle}</p>
                  </div>
                  <span className="tag">creator</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
