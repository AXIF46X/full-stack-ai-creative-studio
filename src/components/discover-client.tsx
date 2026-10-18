"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { remixTrend, toggleBlock } from "@/app/actions";
import { ArrowRightIcon, CompassIcon, ShieldIcon, SparklesIcon, TrendingUpIcon } from "@/components/icons";
import { Avatar, EmptyState, useToast } from "@/components/ui";
import { compactNumber } from "@/lib/format";
import type { CreatorDTO, TrendDTO } from "@/lib/types";

const TABS = [
  { value: "all", label: "All" },
  { value: "music", label: "Music" },
  { value: "meme", label: "Memes" },
  { value: "style", label: "Styles" },
  { value: "creator", label: "Creators" },
];

export function DiscoverClient({
  trends,
  creators,
  searchHint,
}: {
  trends: TrendDTO[];
  creators: CreatorDTO[];
  searchHint: string;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [tab, setTab] = useState("all");
  const [pending, startTransition] = useTransition();
  const [remixed, setRemixed] = useState<number[]>([]);
  const [blocked, setBlocked] = useState<Record<number, boolean>>(
    Object.fromEntries(creators.map((creator) => [creator.id, creator.blocked])),
  );

  const visible = useMemo(() => (tab === "all" ? trends : trends.filter((trend) => trend.kind === tab)), [tab, trends]);
  const trendCreators = creators.filter((creator) => !blocked[creator.id]).slice(0, 6);

  const remix = (trend: TrendDTO) => {
    setRemixed((current) => [...current, trend.id]);
    startTransition(async () => {
      const result = await remixTrend(trend.id);
      if (!result.ok) {
        setRemixed((current) => current.filter((id) => id !== trend.id));
        push(result.error ?? "Could not start remix", "error");
      } else {
        push(`Remix started · ${trend.title} · +20 XP`);
        router.refresh();
      }
    });
  };

  const block = (creator: CreatorDTO) => {
    const next = !blocked[creator.id];
    setBlocked((current) => ({ ...current, [creator.id]: next }));
    startTransition(async () => {
      const result = await toggleBlock(creator.id);
      if (!result.ok) {
        setBlocked((current) => ({ ...current, [creator.id]: !next }));
        push(result.error ?? "Could not update", "error");
      } else {
        push(next ? `Blocked @${creator.handle}` : `Unblocked @${creator.handle}`);
        router.refresh();
      }
    });
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {TABS.map((option) => (
          <button key={option.value} type="button" onClick={() => setTab(option.value)} className={`chip ${tab === option.value ? "chip-active" : ""}`}>
            {option.label}
          </button>
        ))}
        <span className="muted ml-auto hidden items-center gap-1 text-[11px] sm:flex">
          <CompassIcon size={12} /> {searchHint}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.65fr_1fr]">
        <div className="space-y-2.5">
          {visible.length === 0 ? (
            <EmptyState emoji="🧭" title="Nothing trending in this lane yet" body="Switch tabs — music and memes are moving fastest today." />
          ) : (
            visible.map((trend, index) => {
              const isRemixed = remixed.includes(trend.id);
              return (
                <div key={trend.id} className="surface hover-lift flex items-center gap-3 p-3">
                  <span className="font-display muted w-5 shrink-0 text-center text-sm font-bold">{index + 1}</span>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg" style={{ backgroundImage: trend.gradient }}>
                    {trend.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-semibold">{trend.title}</p>
                      <span className="tag capitalize">{trend.kind}</span>
                    </div>
                    <p className="muted truncate text-[11px]">{trend.subtitle}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="progress w-24">
                        <span style={{ width: `${trend.score}%` }} />
                      </div>
                      <span className="text-[10px] font-bold" style={{ color: "#4ade80" }}>+{trend.delta}%</span>
                      <div className="hidden gap-1 sm:flex">
                        {trend.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="tag">#{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => remix(trend)}
                    disabled={pending || isRemixed}
                    className={`btn btn-sm shrink-0 ${isRemixed ? "btn-secondary" : "btn-primary"}`}
                  >
                    {isRemixed ? "Started" : "Remix"} <ArrowRightIcon size={12} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        <aside className="space-y-3">
          <div className="surface p-4">
            <p className="flex items-center gap-1.5 text-sm font-bold"><TrendingUpIcon size={15} /> Trending creators</p>
            <div className="mt-2 space-y-2">
              {trendCreators.map((creator) => (
                <div key={creator.id} className="flex items-center gap-2">
                  <Avatar emoji={creator.emoji} gradient={creator.gradient} size={30} ring />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">{creator.name}</p>
                    <p className="muted truncate text-[10px]">@{creator.handle} · {compactNumber(creator.xp)} XP</p>
                  </div>
                  <button type="button" onClick={() => block(creator)} className="btn-icon h-7 w-7" aria-label={`Block @${creator.handle}`}>
                    <ShieldIcon size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="surface p-4">
            <p className="flex items-center gap-1.5 text-sm font-bold"><SparklesIcon size={15} /> How to ride a trend</p>
            <ol className="muted mt-2 space-y-1 text-xs">
              <li>1. Remix it — Muse seeds a draft with the right tempo.</li>
              <li>2. Add one personal detail nobody else has.</li>
              <li>3. Post within 48h while the curve is steep.</li>
            </ol>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="tag">first-take</span>
              <span className="tag">7-second drop</span>
              <span className="tag">riso cover</span>
            </div>
          </div>

          <div className="surface p-4" style={{ backgroundImage: "linear-gradient(140deg, var(--accent-soft), transparent)" }}>
            <p className="text-sm font-bold">Search smarter</p>
            <p className="muted mt-1 text-xs">Press ⌘K anywhere to search sounds, creators, tools and your own projects.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
