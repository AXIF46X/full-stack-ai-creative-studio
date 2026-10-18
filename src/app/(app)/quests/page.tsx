import Link from "next/link";
import { ChallengeCard } from "@/components/challenge-card";
import { FlameIcon, SparklesIcon, TrophyIcon, ZapIcon } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { Avatar, EmptyState } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getBadges, getChallenges, getLeaderboard, getStats } from "@/lib/data";
import { compactNumber, levelInfo } from "@/lib/format";

export const metadata = { title: "Quests & XP · muse." };

export default async function QuestsPage() {
  const user = await requireUser();
  const [challenges, badges, leaderboard, stats] = await Promise.all([
    getChallenges(user.id),
    getBadges(user.id),
    getLeaderboard(6),
    getStats(user.id),
  ]);

  const { level, percent, toNext, intoLevel } = levelInfo(user.xp);
  const earned = badges.filter((badge) => badge.earned);
  const open = challenges.filter((challenge) => !challenge.done);
  const claimedXp = challenges.filter((challenge) => challenge.done).reduce((sum, challenge) => sum + challenge.xp, 0);
  const weekDays = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div>
      <PageHeader
        eyebrow="Gamification"
        title="Quests, badges and your streak"
        description="Small daily reps compound. Here's your progress, and the fastest XP on the board."
        actions={
          <Link href="/feed" className="btn btn-primary btn-sm">
            <SparklesIcon size={14} /> Post something
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <div className="space-y-4">
          <section className="surface noise overflow-hidden p-5" style={{ backgroundImage: "linear-gradient(135deg, var(--accent-soft), transparent 70%)" }}>
            <div className="flex flex-wrap items-center gap-5">
              <div
                className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full"
                style={{ background: `conic-gradient(var(--accent) ${percent}%, var(--panel-3) ${percent}% 100%)` }}
              >
                <div className="flex h-[92px] w-[92px] flex-col items-center justify-center rounded-full" style={{ background: "var(--panel)" }}>
                  <span className="font-display text-2xl font-bold">{level}</span>
                  <span className="muted text-[10px] font-semibold tracking-wider uppercase">level</span>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-xl font-bold">{user.name.split(" ")[0]}'s creative season</p>
                <p className="muted text-xs">{intoLevel} / 500 XP into level {level} · {toNext} to go</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="chip" style={{ color: "#fb923c", borderColor: "rgba(251,146,60,0.35)" }}>
                    <FlameIcon size={12} /> {user.streak}-day streak
                  </span>
                  <span className="chip"><ZapIcon size={12} /> {user.xp} XP total</span>
                  <span className="chip"><TrophyIcon size={12} /> {earned.length}/{badges.length} badges</span>
                </div>
                <div className="mt-3 flex items-center gap-1">
                  {weekDays.map((day, index) => {
                    const active = index < Math.min(7, user.streak);
                    return (
                      <div key={`${day}-${index}`} className="flex flex-col items-center gap-1">
                        <span
                          className="flex h-8 w-8 items-center justify-center rounded-xl text-[11px] font-bold"
                          style={{
                            background: active ? "var(--accent-soft)" : "var(--panel-2)",
                            border: active ? "1px solid color-mix(in srgb, var(--accent) 45%, transparent)" : "1px solid var(--border)",
                            color: active ? "var(--accent)" : "var(--muted)",
                          }}
                        >
                          {active ? "🔥" : day}
                        </span>
                        <span className="muted text-[9px]">{day}</span>
                      </div>
                    );
                  })}
                  <span className="muted ml-2 text-[11px]">keep it alive →</span>
                </div>
              </div>
            </div>
          </section>

          <section className="surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="font-display text-base font-bold">Daily challenges</h2>
                <p className="muted text-xs">{open.length} open · {challenges.filter((challenge) => challenge.done).length} claimed today</p>
              </div>
              <span className="chip chip-active"><ZapIcon size={12} /> {open.reduce((sum, challenge) => sum + challenge.xp, 0)} XP available</span>
            </div>
            {challenges.length === 0 ? (
              <EmptyState emoji="⚡" title="No challenges today" body="Come back tomorrow — new challenges drop at midnight." />
            ) : (
              <div className="space-y-2">
                {challenges.map((challenge) => (
                  <ChallengeCard key={challenge.id} challenge={challenge} />
                ))}
              </div>
            )}
          </section>

          <section className="surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-base font-bold">Badges</h2>
              <span className="muted text-xs">{earned.length} collected · {claimedXp} XP from challenges</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className="surface-2 flex items-start gap-2 p-2.5"
                  style={{ opacity: badge.earned ? 1 : 0.6 }}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base"
                    style={{ background: badge.earned ? "var(--accent-soft)" : "var(--panel-3)", filter: badge.earned ? "none" : "grayscale(1)" }}
                  >
                    {badge.emoji}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold">{badge.name}</p>
                    <p className="muted text-[10px] leading-snug">{badge.earned ? badge.description : `Unlocks at ${badge.xpRequired} XP`}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <section className="surface p-4">
            <h2 className="font-display text-base font-bold">Your stats</h2>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {[
                { label: "Projects", value: stats.projects },
                { label: "Posts", value: stats.posts },
                { label: "Likes earned", value: compactNumber(stats.likes) },
                { label: "Challenges", value: stats.challenges },
              ].map((stat) => (
                <div key={stat.label} className="surface-2 p-2.5">
                  <p className="muted text-[10px] font-semibold tracking-wider uppercase">{stat.label}</p>
                  <p className="font-display text-lg font-bold">{stat.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="surface p-4">
            <h2 className="font-display mb-2 text-base font-bold">XP leaderboard</h2>
            <div className="space-y-2">
              {leaderboard.map((row, index) => (
                <div key={row.id} className="flex items-center gap-2">
                  <span className="font-display muted w-4 text-center text-xs font-bold">{index + 1}</span>
                  <Avatar emoji={row.emoji} gradient={row.gradient} size={28} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">
                      {row.name} {row.id === user.id ? <span style={{ color: "var(--accent)" }}>(you)</span> : null}
                    </p>
                    <p className="muted text-[10px]">@{row.handle} · {row.streak}d streak</p>
                  </div>
                  <span className="text-[11px] font-bold" style={{ color: "var(--accent)" }}>{compactNumber(row.xp)}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="surface p-4" style={{ backgroundImage: "linear-gradient(140deg, var(--accent-soft), transparent)" }}>
            <p className="text-sm font-bold">How XP works</p>
            <ul className="muted mt-2 space-y-1 text-xs">
              <li>✦ Post a creation: +20 XP</li>
              <li>✦ Comment that helps: +5 XP</li>
              <li>✦ Publish a project: +60 XP</li>
              <li>✦ Join a community: +10 XP</li>
              <li>✦ Daily challenge: 35–100 XP</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
