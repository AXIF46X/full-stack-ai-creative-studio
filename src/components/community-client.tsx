"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleBlock, toggleGroupMembership } from "@/app/actions";
import { CheckIcon, LockIcon, ShieldIcon, UsersIcon } from "@/components/icons";
import { PostCard } from "@/components/post-card";
import { Avatar, EmptyState, useToast } from "@/components/ui";
import { compactNumber } from "@/lib/format";
import type { CurrentUser, CreatorDTO, GroupDTO, PostDTO } from "@/lib/types";

export function CommunityClient({
  viewer,
  groups,
  creators,
  posts,
}: {
  viewer: CurrentUser;
  groups: GroupDTO[];
  creators: CreatorDTO[];
  posts: PostDTO[];
}) {
  const router = useRouter();
  const { push } = useToast();
  const [tab, setTab] = useState<"groups" | "creators">("groups");
  const [filter, setFilter] = useState("all");
  const [pending, startTransition] = useTransition();
  const [joined, setJoined] = useState<Record<number, boolean>>(
    Object.fromEntries(groups.map((group) => [group.id, group.joined])),
  );
  const [counts, setCounts] = useState<Record<number, number>>(
    Object.fromEntries(groups.map((group) => [group.id, group.memberCount])),
  );
  const [blocked, setBlocked] = useState<Record<number, boolean>>(
    Object.fromEntries(creators.map((creator) => [creator.id, creator.blocked])),
  );

  const filters = useMemo(() => {
    const tags = new Set<string>();
    groups.forEach((group) => group.tags.forEach((tag) => tags.add(tag)));
    return ["all", ...Array.from(tags).slice(0, 7)];
  }, [groups]);

  const visibleGroups = filter === "all" ? groups : groups.filter((group) => group.tags.includes(filter));

  const join = (group: GroupDTO) => {
    const next = !joined[group.id];
    setJoined((current) => ({ ...current, [group.id]: next }));
    setCounts((current) => ({ ...current, [group.id]: Math.max(0, (current[group.id] ?? group.memberCount) + (next ? 1 : -1)) }));
    startTransition(async () => {
      const result = await toggleGroupMembership(group.id);
      if (!result.ok) {
        setJoined((current) => ({ ...current, [group.id]: !next }));
        push(result.error ?? "Could not update membership", "error");
      } else {
        push(next ? `Joined ${group.name} · +10 XP` : `Left ${group.name}`);
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
    <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button type="button" onClick={() => setTab("groups")} className={`chip ${tab === "groups" ? "chip-active" : ""}`}>
            <UsersIcon size={12} /> Interest groups
          </button>
          <button type="button" onClick={() => setTab("creators")} className={`chip ${tab === "creators" ? "chip-active" : ""}`}>
            🫂 Creators
          </button>
          {tab === "groups" ? (
            <div className="hide-scrollbar ml-auto flex gap-1.5 overflow-x-auto">
              {filters.map((tag) => (
                <button key={tag} type="button" onClick={() => setFilter(tag)} className={`chip shrink-0 ${filter === tag ? "chip-active" : ""}`}>
                  {tag}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {tab === "groups" ? (
          visibleGroups.length === 0 ? (
            <EmptyState emoji="🫥" title="No groups match that interest" body="Try another tag — or start the group yourself when you're ready." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {visibleGroups.map((group) => {
                const isJoined = joined[group.id];
                return (
                  <div key={group.id} className="surface hover-lift overflow-hidden">
                    <div className="flex h-20 items-center gap-2 px-3" style={{ backgroundImage: group.gradient }}>
                      <span className="text-2xl">{group.emoji}</span>
                      <div className="min-w-0 text-white">
                        <p className="truncate text-sm font-bold drop-shadow">{group.name}</p>
                        <p className="text-[10px] opacity-90">{compactNumber(counts[group.id] ?? group.memberCount)} members</p>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="muted line-clamp-2 text-xs leading-relaxed">{group.description}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {group.tags.map((tag) => (
                          <span key={tag} className="tag">{tag}</span>
                        ))}
                      </div>
                      <div className="mt-2.5 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => join(group)}
                          className={`btn btn-sm ${isJoined ? "btn-secondary" : "btn-primary"}`}
                          disabled={pending}
                        >
                          {isJoined ? <><CheckIcon size={12} /> Joined</> : "Join group"}
                        </button>
                        {isJoined ? (
                          <span className="muted text-[10px]">You're in — say hi today</span>
                        ) : (
                          <span className="muted text-[10px]">+10 XP on join</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div className="space-y-2">
            {creators.map((creator) => (
              <div key={creator.id} className="surface flex items-center gap-3 p-3">
                <Avatar emoji={creator.emoji} gradient={creator.gradient} size={40} ring />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{creator.name}</p>
                  <p className="muted truncate text-[11px]">@{creator.handle} · {compactNumber(creator.xp)} XP</p>
                  <p className="muted mt-0.5 line-clamp-1 text-[11px]">{creator.bio}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <button
                    type="button"
                    onClick={() => block(creator)}
                    className={`btn btn-sm ${blocked[creator.id] ? "btn-danger" : "btn-secondary"}`}
                    disabled={pending}
                  >
                    <ShieldIcon size={12} /> {blocked[creator.id] ? "Blocked" : "Block"}
                  </button>
                  <span className="muted text-[10px]">report via settings</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display text-base font-bold">Community pulse</h2>
            <span className="muted text-[11px]">latest creations · fresh from the studio</span>
          </div>
          <div className="space-y-3">
            {posts.slice(0, 3).map((post) => (
              <PostCard key={post.id} post={post} viewer={viewer} />
            ))}
          </div>
        </div>
      </div>

      <aside className="space-y-3">
        <div className="surface p-4">
          <p className="text-sm font-bold">Community guidelines</p>
          <ul className="muted mt-2 space-y-1.5 text-xs">
            <li>✦ Give notes like a collaborator, not a critic.</li>
            <li>✦ Credit samples, presets and inspirations.</li>
            <li>✦ No promo spam — send it to the marketplace.</li>
            <li>✦ Report harmful content; mods review in minutes.</li>
          </ul>
          <div className="mt-2 flex items-center gap-1.5 text-[11px]">
            <LockIcon size={12} style={{ color: "var(--accent)" }} />
            <span className="muted">Your DMs and drafts stay private</span>
          </div>
        </div>

        <div className="surface p-4">
          <p className="text-sm font-bold">Your groups</p>
          {groups.filter((group) => joined[group.id]).length === 0 ? (
            <p className="muted mt-1 text-xs">You haven't joined a group yet. Start with Bedroom Pop Basement.</p>
          ) : (
            <div className="mt-2 space-y-1.5">
              {groups
                .filter((group) => joined[group.id])
                .map((group) => (
                  <div key={group.id} className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg text-xs" style={{ backgroundImage: group.gradient }}>{group.emoji}</span>
                    <p className="flex-1 truncate text-xs font-semibold">{group.name}</p>
                    <span className="muted text-[10px]">{compactNumber(counts[group.id] ?? group.memberCount)}</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="surface p-4" style={{ backgroundImage: "linear-gradient(140deg, var(--accent-soft), transparent)" }}>
          <p className="text-sm font-bold">Collab ready?</p>
          <p className="muted mt-1 text-xs">Drop a 15-second open verse in a group with your tempo and key. That's how most collabs start here.</p>
          <a href="/music" className="btn btn-primary btn-sm mt-2 w-full">Open a session</a>
        </div>
      </aside>
    </div>
  );
}
