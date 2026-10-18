"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPost } from "@/app/actions";
import { createPostGradientOptions } from "@/components/composer-options";
import { SparklesIcon, TrendingUpIcon, UsersIcon, WandIcon } from "@/components/icons";
import { PostCard } from "@/components/post-card";
import { Avatar, EmptyState, useToast } from "@/components/ui";
import { compactNumber } from "@/lib/format";
import type { CurrentUser, PostDTO, TrendDTO } from "@/lib/types";

const KINDS = [
  { value: "art", label: "Art / cover" },
  { value: "audio", label: "Audio" },
  { value: "video", label: "Video" },
  { value: "meme", label: "Meme" },
];

const FILTERS = [
  { value: "all", label: "For you" },
  { value: "audio", label: "Music" },
  { value: "art", label: "Art" },
  { value: "video", label: "Video" },
  { value: "meme", label: "Memes" },
];

export function FeedClient({
  viewer,
  posts,
  trends,
  creators,
}: {
  viewer: CurrentUser;
  posts: PostDTO[];
  trends: TrendDTO[];
  creators: { id: number; name: string; handle: string; emoji: string; gradient: string }[];
}) {
  const router = useRouter();
  const { push } = useToast();
  const [pending, startTransition] = useTransition();
  const [caption, setCaption] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [kind, setKind] = useState("art");
  const [gradientIndex, setGradientIndex] = useState(0);
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState<"new" | "top">("new");
  const [optimisticPosts, setOptimisticPosts] = useState<PostDTO[]>([]);

  const gradients = createPostGradientOptions;

  useEffect(() => {
    setOptimisticPosts((current) =>
      current.filter((temp) => !posts.some((post) => post.caption === temp.caption && post.isMine)),
    );
  }, [posts]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const text = caption.trim();
    if (!text) {
      push("Write a caption first", "error");
      return;
    }
    const tags = tagInput
      .split(/[\s,]+/)
      .map((tag) => tag.replace(/^#/, "").toLowerCase())
      .filter(Boolean)
      .slice(0, 4);

    const temp: PostDTO = {
      id: -Date.now(),
      caption: text,
      mediaUrl: null,
      mediaKind: kind,
      gradient: gradients[gradientIndex],
      emoji: viewer.avatarEmoji,
      tags,
      likeCount: 0,
      commentCount: 0,
      createdLabel: "just now",
      reacted: false,
      isMine: true,
      author: { id: viewer.id, name: viewer.name, handle: viewer.handle, emoji: viewer.avatarEmoji, gradient: viewer.gradient },
      comments: [],
    };

    setOptimisticPosts((current) => [temp, ...current]);
    setCaption("");
    setTagInput("");
    startTransition(async () => {
      const result = await createPost({ caption: text, mediaKind: kind, tags, emoji: viewer.avatarEmoji, gradient: gradients[gradientIndex] });
      if (!result.ok) {
        setOptimisticPosts((current) => current.filter((post) => post.id !== temp.id));
        push(result.error ?? "Could not post", "error");
      } else {
        push("Posted · +20 XP");
        router.refresh();
      }
    });
  };

  const allPosts = [...optimisticPosts, ...posts];
  const visible = useMemo(() => {
    const filtered = filter === "all" ? allPosts : allPosts.filter((post) => post.mediaKind === filter);
    return sort === "top" ? [...filtered].sort((a, b) => b.likeCount - a.likeCount) : filtered;
  }, [allPosts, filter, sort]);

  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    posts.forEach((post) => post.tags.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [posts]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.65fr_1fr]">
      <div className="space-y-3">
        <form onSubmit={submit} className="surface p-4">
          <div className="flex items-start gap-3">
            <Avatar emoji={viewer.avatarEmoji} gradient={viewer.gradient} size={38} ring />
            <div className="min-w-0 flex-1">
              <textarea
                className="field min-h-[74px]"
                placeholder={`What are you dropping today, ${viewer.name.split(" ")[0]}?`}
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                maxLength={500}
              />
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {KINDS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setKind(option.value)}
                    className={`chip ${kind === option.value ? "chip-active" : ""}`}
                  >
                    {option.label}
                  </button>
                ))}
                <input
                  className="field ml-auto w-full max-w-[190px] py-1.5 text-xs"
                  placeholder="#tags, comma separated"
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                />
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {gradients.map((gradient, index) => (
                    <button
                      key={gradient}
                      type="button"
                      onClick={() => setGradientIndex(index)}
                      aria-label={`Cover style ${index + 1}`}
                      className="h-6 w-6 rounded-full transition"
                      style={{
                        backgroundImage: gradient,
                        outline: gradientIndex === index ? "2px solid var(--accent)" : "1px solid var(--border)",
                        outlineOffset: 2,
                      }}
                    />
                  ))}
                  <Link href="/creator" className="muted ml-1 flex items-center gap-1 text-[11px] font-semibold">
                    <WandIcon size={12} /> get a caption
                  </Link>
                </div>
                <button type="submit" className="btn btn-primary btn-sm" disabled={pending || !caption.trim()}>
                  {pending ? "Posting…" : "Post · +20 XP"}
                </button>
              </div>
            </div>
          </div>
        </form>

        <div className="flex flex-wrap items-center gap-1.5">
          {FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              className={`chip ${filter === option.value ? "chip-active" : ""}`}
            >
              {option.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1.5">
            <button type="button" onClick={() => setSort("new")} className={`chip ${sort === "new" ? "chip-active" : ""}`}>
              Newest
            </button>
            <button type="button" onClick={() => setSort("top")} className={`chip ${sort === "top" ? "chip-active" : ""}`}>
              Top
            </button>
          </div>
        </div>

        {visible.length === 0 ? (
          <EmptyState
            emoji="🌱"
            title="This feed is waiting on you"
            body="No posts match this filter yet. Try another tab or be the first to drop something."
            action={
              <button type="button" className="btn btn-primary btn-sm" onClick={() => { setFilter("all"); setSort("new"); }}>
                Reset filters
              </button>
            }
          />
        ) : (
          <div className="space-y-3">
            {visible.map((post) => (
              <PostCard key={post.id} post={post} viewer={viewer} />
            ))}
          </div>
        )}
      </div>

      <aside className="space-y-3">
        <div className="surface p-4">
          <div className="flex items-center gap-2">
            <SparklesIcon size={15} style={{ color: "var(--accent)" }} />
            <p className="text-sm font-bold">Feed tuned to you</p>
          </div>
          <p className="muted mt-1 text-xs leading-relaxed">
            Prioritizing {viewer.interests.slice(0, 3).join(", ") || "your interests"} and creators you react to
            most. Opt out any time in Settings → Safety.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {viewer.interests.slice(0, 5).map((interest) => (
              <span key={interest} className="tag" style={{ color: "var(--accent)" }}>{interest}</span>
            ))}
          </div>
        </div>

        <div className="surface p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-sm font-bold"><TrendingUpIcon size={15} /> Trending tags</p>
            <Link href="/discover" className="muted text-[11px] font-semibold">More →</Link>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {tags.map(([tag, count]) => (
              <span key={tag} className="chip">
                #{tag} <span className="muted">{compactNumber(count)}</span>
              </span>
            ))}
          </div>
          <div className="mt-3 space-y-1.5">
            {trends.slice(0, 3).map((trend) => (
              <Link key={trend.id} href="/discover" className="flex items-center gap-2 rounded-xl px-1 py-1 hover:brightness-110">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg text-xs" style={{ backgroundImage: trend.gradient }}>{trend.emoji}</span>
                <p className="min-w-0 flex-1 truncate text-xs font-semibold">{trend.title}</p>
                <span className="text-[10px] font-bold" style={{ color: "#4ade80" }}>+{trend.delta}%</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="surface p-4">
          <p className="flex items-center gap-1.5 text-sm font-bold"><UsersIcon size={15} /> Creators in this feed</p>
          <div className="mt-2 space-y-2">
            {creators.slice(0, 5).map((creator) => (
              <div key={creator.id} className="flex items-center gap-2">
                <Avatar emoji={creator.emoji} gradient={creator.gradient} size={28} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold">{creator.name}</p>
                  <p className="muted text-[10px]">@{creator.handle}</p>
                </div>
                <Link href="/community" className="btn btn-secondary btn-sm">View</Link>
              </div>
            ))}
          </div>
        </div>

        <div className="surface p-4" style={{ backgroundImage: "linear-gradient(140deg, var(--accent-soft), transparent)" }}>
          <p className="text-sm font-bold">Posting tip from Muse</p>
          <p className="muted mt-1 text-xs">
            One line caption + a timestamp in the comments = 2.3× more replies. Try “bridge at 0:42 — too much?”
          </p>
          <Link href="/assistant" className="btn btn-primary btn-sm mt-2 w-full">Ask for a caption</Link>
        </div>
      </aside>
    </div>
  );
}
