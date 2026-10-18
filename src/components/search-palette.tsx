"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SearchIcon, SparklesIcon, XIcon } from "@/components/icons";
import { Avatar } from "@/components/ui";

type Results = {
  query: string;
  posts: { id: number; caption: string; emoji: string; gradient: string; name: string }[];
  creators: { id: number; name: string; handle: string; emoji: string; gradient: string }[];
  groups: { id: number; name: string; emoji: string; gradient: string }[];
  projects: { id: number; title: string; emoji: string; kind: string }[];
  trends: { id: number; title: string; emoji: string; kind: string }[];
  tools: { label: string; href: string; emoji: string; description: string }[];
};

const EMPTY: Results = { query: "", posts: [], creators: [], groups: [], projects: [], trends: [], tools: [] };

export function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Results>(EMPTY);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = (await response.json()) as Results;
        if (!cancelled) setResults({ ...EMPTY, ...data });
      } catch {
        if (!cancelled) setResults(EMPTY);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 220);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, open]);

  if (!open) return null;

  const total =
    results.posts.length + results.creators.length + results.groups.length + results.trends.length + results.tools.length + results.projects.length;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Smart search">
      <button type="button" aria-label="Close search" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="animate-pop relative mt-8 w-full max-w-2xl overflow-hidden rounded-3xl"
        style={{ background: "var(--panel)", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}
      >
        <div className="flex items-center gap-3 border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
          <SearchIcon size={18} style={{ color: "var(--accent)" }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search sounds, creators, communities, tools…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--text)" }}
          />
          {loading ? <span className="muted text-[11px]">searching…</span> : null}
          <button type="button" className="btn-icon h-8 w-8" onClick={onClose} aria-label="Close">
            <XIcon size={14} />
          </button>
        </div>

        <div className="scroll-thin max-h-[65dvh] overflow-y-auto p-3">
          {loading && total === 0 ? (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((index) => (
                <div key={index} className="skeleton h-12 w-full" />
              ))}
            </div>
          ) : null}

          {!loading && total === 0 && query.length >= 2 ? (
            <div className="px-3 py-10 text-center">
              <p className="text-2xl">🫥</p>
              <p className="mt-2 text-sm font-semibold">No matches for “{query}”</p>
              <p className="muted mt-1 text-xs">Try a creator handle, a sound, or “thumbnail”.</p>
            </div>
          ) : null}

          {results.creators.length > 0 ? (
            <Section label="Creators">
              {results.creators.map((creator) => (
                <Link key={creator.id} href="/community" onClick={onClose} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:brightness-110">
                  <Avatar emoji={creator.emoji} gradient={creator.gradient} size={30} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{creator.name}</p>
                    <p className="muted text-[11px]">@{creator.handle}</p>
                  </div>
                </Link>
              ))}
            </Section>
          ) : null}

          {results.trends.length > 0 ? (
            <Section label="Trending & sounds">
              {results.trends.map((trend) => (
                <Link key={trend.id} href="/discover" onClick={onClose} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:brightness-110">
                  <span className="text-lg">{trend.emoji}</span>
                  <p className="flex-1 truncate text-sm">{trend.title}</p>
                  <span className="tag">{trend.kind}</span>
                </Link>
              ))}
            </Section>
          ) : null}

          {results.groups.length > 0 ? (
            <Section label="Communities">
              {results.groups.map((group) => (
                <Link key={group.id} href="/community" onClick={onClose} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:brightness-110">
                  <span className="text-lg">{group.emoji}</span>
                  <p className="flex-1 truncate text-sm">{group.name}</p>
                </Link>
              ))}
            </Section>
          ) : null}

          {results.projects.length > 0 ? (
            <Section label="Your projects">
              {results.projects.map((project) => (
                <Link
                  key={project.id}
                  href={project.kind === "music" ? "/music" : "/creator"}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-xl px-2 py-2 hover:brightness-110"
                >
                  <span className="text-lg">{project.emoji}</span>
                  <p className="flex-1 truncate text-sm">{project.title}</p>
                  <span className="tag">{project.kind}</span>
                </Link>
              ))}
            </Section>
          ) : null}

          {results.posts.length > 0 ? (
            <Section label="Posts">
              {results.posts.map((post) => (
                <Link key={post.id} href="/feed" onClick={onClose} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:brightness-110">
                  <span className="text-lg">{post.emoji}</span>
                  <p className="muted flex-1 truncate text-xs">{post.caption}</p>
                  <span className="text-[11px] font-semibold">{post.name.split(" ")[0]}</span>
                </Link>
              ))}
            </Section>
          ) : null}

          {results.tools.length > 0 ? (
            <Section label={query.length >= 2 ? "Tools" : "Jump to a tool"}>
              {results.tools.map((tool) => (
                <Link key={tool.label} href={tool.href} onClick={onClose} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:brightness-110">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-sm"
                    style={{ background: "var(--accent-soft)" }}
                  >
                    {tool.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{tool.label}</p>
                    <p className="muted truncate text-[11px]">{tool.description}</p>
                  </div>
                  <SparklesIcon size={13} style={{ color: "var(--accent)" }} />
                </Link>
              ))}
            </Section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <p className="muted mb-1 px-2 text-[10px] font-bold tracking-[0.14em] uppercase">{label}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}
