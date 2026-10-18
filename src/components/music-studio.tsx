"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createProject,
  deleteProject,
  generateLyrics,
  publishProject,
  suggestMix,
  toggleProjectOffline,
  updateProject,
} from "@/app/actions";
import {
  CloudOffIcon,
  DownloadIcon,
  LockIcon,
  MicIcon,
  MusicIcon,
  PencilIcon,
  PlusIcon,
  SparklesIcon,
  TrashIcon,
  ZapIcon,
} from "@/components/icons";
import { BeatPlayer } from "@/components/beat-player";
import { downloadText, slugify } from "@/lib/download";
import { EMOJI_OPTIONS, TONES, VOCAL_STYLES, createPostGradientOptions } from "@/components/composer-options";
import { CopyButton, EmptyState, GradientArt, ProgressBar, useToast } from "@/components/ui";
import type { CurrentUser, ProjectDTO } from "@/lib/types";

type Draft = {
  title: string;
  description: string;
  bpm: number;
  tone: string;
  vocalStyle: string;
  lyrics: string;
  caption: string;
  emoji: string;
  gradient: string;
  progress: number;
  savedOffline: boolean;
};

const draftFrom = (project: ProjectDTO): Draft => ({
  title: project.title,
  description: project.description,
  bpm: project.bpm,
  tone: project.tone,
  vocalStyle: project.vocalStyle,
  lyrics: project.lyrics,
  caption: project.caption,
  emoji: project.emoji,
  gradient: project.gradient,
  progress: project.progress,
  savedOffline: project.savedOffline,
});

export function MusicStudio({ viewer, projects }: { viewer: CurrentUser; projects: ProjectDTO[] }) {
  const router = useRouter();
  const { push } = useToast();
  const [items, setItems] = useState(projects);
  const [selectedId, setSelectedId] = useState<number | null>(projects[0]?.id ?? null);
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(projects[0] ? draftFrom(projects[0]) : null);
  const [mixTips, setMixTips] = useState<string[]>([]);
  const [lyricLines, setLyricLines] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();
  const [newTitle, setNewTitle] = useState("");
  const [newBpm, setNewBpm] = useState(120);
  const [newTone, setNewTone] = useState("midnight");
  const [newVocal, setNewVocal] = useState("airy");
  const [newEmoji, setNewEmoji] = useState("🎧");
  const [newGradient, setNewGradient] = useState(createPostGradientOptions[0]);

  useEffect(() => {
    setItems(projects);
    if (projects.length === 0) {
      setSelectedId(null);
      setDraft(null);
      return;
    }
    if (!projects.some((project) => project.id === selectedId)) {
      setSelectedId(projects[0].id);
      setDraft(draftFrom(projects[0]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects]);

  const selected = items.find((project) => project.id === selectedId) ?? null;

  const select = (project: ProjectDTO) => {
    setSelectedId(project.id);
    setDraft(draftFrom(project));
    setMixTips([]);
    setLyricLines([]);
    setConfirmDelete(false);
  };

  const filtered = useMemo(
    () => items.filter((project) => project.title.toLowerCase().includes(query.toLowerCase())),
    [items, query],
  );

  const save = () => {
    if (!selected || !draft) return;
    if (!draft.title.trim()) {
      push("Give the project a title", "error");
      return;
    }
    setItems((current) =>
      current.map((project) =>
        project.id === selected.id ? { ...project, ...draft, title: draft.title.trim(), updatedLabel: "just now" } : project,
      ),
    );
    startTransition(async () => {
      const result = await updateProject(selected.id, draft);
      if (!result.ok) push(result.error ?? "Could not save", "error");
      else {
        push("Project saved");
        router.refresh();
      }
    });
  };

  const create = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newTitle.trim()) {
      push("Name your project first", "error");
      return;
    }
    startTransition(async () => {
      const result = await createProject({
        title: newTitle,
        kind: "music",
        bpm: newBpm,
        tone: newTone,
        vocalStyle: newVocal,
        emoji: newEmoji,
        gradient: newGradient,
        description: "New sketch — add a hook, then match the lyrics.",
      });
      if (!result.ok) push(result.error ?? "Could not create project", "error");
      else {
        push("New project created · +15 XP");
        setCreateOpen(false);
        setNewTitle("");
        router.refresh();
      }
    });
  };

  const remove = () => {
    if (!selected) return;
    const id = selected.id;
    setConfirmDelete(false);
    setItems((current) => current.filter((project) => project.id !== id));
    setSelectedId(null);
    setDraft(null);
    startTransition(async () => {
      const result = await deleteProject(id);
      if (!result.ok) push(result.error ?? "Could not delete", "error");
      else {
        push("Project deleted");
        router.refresh();
      }
    });
  };

  const publish = () => {
    if (!selected) return;
    startTransition(async () => {
      const result = await publishProject(selected.id);
      if (!result.ok) push(result.error ?? "Could not publish", "error");
      else {
        push("Published to your feed · +60 XP");
        router.refresh();
      }
    });
  };

  const toggleOffline = () => {
    if (!selected || !draft) return;
    const next = !draft.savedOffline;
    setDraft({ ...draft, savedOffline: next });
    setItems((current) => current.map((project) => (project.id === selected.id ? { ...project, savedOffline: next } : project)));
    startTransition(async () => {
      const result = await toggleProjectOffline(selected.id);
      if (!result.ok) push(result.error ?? "Could not update offline status", "error");
      else {
        push(next ? "Saved for offline mode" : "Removed from offline");
        router.refresh();
      }
    });
  };

  const askMix = () => {
    if (!selected) return;
    startTransition(async () => {
      const result = await suggestMix(selected.id);
      if (!result.ok) push(result.error ?? "AI is busy", "error");
      else setMixTips(result.tips ?? []);
    });
  };

  const matchLyrics = () => {
    if (!draft) return;
    startTransition(async () => {
      const result = await generateLyrics(draft.title || draft.description || "midnight", draft.tone);
      if (!result.ok) push(result.error ?? "AI is busy", "error");
      else setLyricLines(result.lines ?? []);
    });
  };

  return (
    <div>
      <div className="grid gap-4 lg:grid-cols-[290px_1fr]">
        <aside className="space-y-2">
          <div className="surface p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold tracking-wider uppercase" style={{ color: "var(--muted)" }}>
                Sessions · {items.length}
              </p>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setCreateOpen((open) => !open)}>
                <PlusIcon size={13} /> New
              </button>
            </div>
            <input
              className="field mt-2 py-1.5 text-xs"
              placeholder="Filter projects…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <div className="scroll-thin mt-2 max-h-[420px] space-y-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="muted px-1 py-3 text-xs">Nothing matches “{query}”.</p>
              ) : (
                filtered.map((project) => {
                  const active = project.id === selectedId;
                  return (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => select(project)}
                      className="flex w-full items-center gap-2 rounded-xl border px-2 py-2 text-left transition"
                      style={{
                        background: active ? "var(--accent-soft)" : "transparent",
                        borderColor: active ? "color-mix(in srgb, var(--accent) 45%, transparent)" : "transparent",
                      }}
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg text-sm" style={{ backgroundImage: project.gradient }}>
                        {project.emoji}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold">{project.title}</span>
                        <span className="muted block text-[10px] capitalize">
                          {project.status.replace("_", " ")} · {project.bpm} BPM
                        </span>
                      </span>
                      {project.savedOffline ? <CloudOffIcon size={12} style={{ color: "var(--accent)" }} /> : null}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {createOpen ? (
            <form onSubmit={create} className="surface animate-pop space-y-2 p-3">
              <p className="text-xs font-bold">New session</p>
              <input className="field text-xs" placeholder="Track name" value={newTitle} onChange={(event) => setNewTitle(event.target.value)} autoFocus />
              <div className="grid grid-cols-2 gap-2">
                <select className="field text-xs" value={newTone} onChange={(event) => setNewTone(event.target.value)}>
                  {TONES.map((tone) => (
                    <option key={tone} value={tone}>{tone}</option>
                  ))}
                </select>
                <select className="field text-xs" value={newVocal} onChange={(event) => setNewVocal(event.target.value)}>
                  {VOCAL_STYLES.map((style) => (
                    <option key={style} value={style}>{style} vocals</option>
                  ))}
                </select>
              </div>
              <label className="muted block text-[11px] font-semibold">Tempo · {newBpm} BPM</label>
              <input type="range" min={60} max={180} value={newBpm} onChange={(event) => setNewBpm(Number(event.target.value))} className="w-full" />
              <div className="flex flex-wrap gap-1">
                {EMOJI_OPTIONS.slice(0, 8).map((emoji) => (
                  <button key={emoji} type="button" onClick={() => setNewEmoji(emoji)} className={`chip ${newEmoji === emoji ? "chip-active" : ""}`} style={{ padding: "0.2rem 0.45rem" }}>
                    {emoji}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {createPostGradientOptions.map((gradient) => (
                  <button
                    key={gradient}
                    type="button"
                    aria-label="Cover style"
                    onClick={() => setNewGradient(gradient)}
                    className="h-5 w-5 rounded-full"
                    style={{ backgroundImage: gradient, outline: newGradient === gradient ? "2px solid var(--accent)" : "1px solid var(--border)", outlineOffset: 2 }}
                  />
                ))}
              </div>
              <button type="submit" className="btn btn-primary btn-sm w-full" disabled={pending}>
                {pending ? "Creating…" : "Create session"}
              </button>
            </form>
          ) : null}

          <div className="surface p-3">
            <p className="flex items-center gap-1.5 text-xs font-bold"><SparklesIcon size={13} /> Studio AI</p>
            <p className="muted mt-1 text-[11px] leading-relaxed">
              Vocal tuning, lyric matching and tone shifts use your {viewer.plan} plan limits.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="tag">auto-tune</span>
              <span className="tag">stem split</span>
              <span className="tag">lyric match</span>
            </div>
          </div>
        </aside>

        <div className="space-y-3">
          {!selected || !draft ? (
            <EmptyState
              emoji="🎛️"
              title="Your studio is silent (for now)"
              body="Create your first session to get a tempo lane, vocal chain, lyric matcher and AI mix notes."
              action={
                <button type="button" className="btn btn-primary btn-sm" onClick={() => setCreateOpen(true)}>
                  <PlusIcon size={14} /> Start a session
                </button>
              }
            />
          ) : (
            <>
              <div className="surface overflow-hidden">
                <GradientArt gradient={draft.gradient} emoji={draft.emoji} className="h-32 w-full" label={draft.title} />
                <div className="p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      className="field flex-1 text-base font-bold"
                      value={draft.title}
                      onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                      aria-label="Project title"
                    />
                    <span className="chip capitalize">{selected.status.replace("_", " ")}</span>
                    <button type="button" onClick={toggleOffline} className={`chip ${draft.savedOffline ? "chip-active" : ""}`}>
                      <CloudOffIcon size={12} /> {draft.savedOffline ? "Offline ready" : "Save offline"}
                    </button>
                  </div>

                  <div className="mt-4">
                    <BeatPlayer
                      bpm={draft.bpm}
                      tone={draft.tone}
                      vocalStyle={draft.vocalStyle}
                      title={draft.title}
                      gradient={draft.gradient}
                      emoji={draft.emoji}
                      onToneChange={(nextTone) => setDraft({ ...draft, tone: nextTone })}
                    />
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="muted mb-1 flex items-center justify-between text-[11px] font-semibold">
                        <span>Tempo</span>
                        <span style={{ color: "var(--accent)" }}>{draft.bpm} BPM</span>
                      </span>
                      <input
                        type="range"
                        min={60}
                        max={180}
                        value={draft.bpm}
                        onChange={(event) => setDraft({ ...draft, bpm: Number(event.target.value) })}
                        className="w-full"
                      />
                    </label>
                    <label className="block">
                      <span className="muted mb-1 flex items-center justify-between text-[11px] font-semibold">
                        <span>Completion</span>
                        <span style={{ color: "var(--accent)" }}>{draft.progress}%</span>
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={draft.progress}
                        onChange={(event) => setDraft({ ...draft, progress: Number(event.target.value) })}
                        className="w-full"
                      />
                      <ProgressBar value={draft.progress} className="mt-1" />
                    </label>
                    <label className="block">
                      <span className="muted mb-1 block text-[11px] font-semibold">Tone</span>
                      <select className="field text-xs capitalize" value={draft.tone} onChange={(event) => setDraft({ ...draft, tone: event.target.value })}>
                        {[...new Set([draft.tone, ...TONES])].map((tone) => (
                          <option key={tone} value={tone}>{tone}</option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="muted mb-1 flex items-center gap-1 text-[11px] font-semibold"><MicIcon size={12} /> Vocals</span>
                      <select className="field text-xs capitalize" value={draft.vocalStyle} onChange={(event) => setDraft({ ...draft, vocalStyle: event.target.value })}>
                        {[...new Set([draft.vocalStyle, ...VOCAL_STYLES])].map((style) => (
                          <option key={style} value={style}>{style}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="mt-3 block">
                    <span className="muted mb-1 block text-[11px] font-semibold">Description</span>
                    <input className="field text-xs" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
                  </label>

                  <label className="mt-3 block">
                    <span className="muted mb-1 flex items-center justify-between text-[11px] font-semibold">
                      <span>Lyrics</span>
                      <span className="flex items-center gap-1">
                        <CopyButton value={draft.lyrics || draft.caption} label="Copy lyrics" />
                        <button type="button" className="chip" onClick={matchLyrics} disabled={pending}>
                          <SparklesIcon size={12} /> Match lyrics
                        </button>
                      </span>
                    </span>
                    <textarea
                      className="field text-xs"
                      rows={4}
                      placeholder="Write a hook, or let Muse match lines to your beat…"
                      value={draft.lyrics}
                      onChange={(event) => setDraft({ ...draft, lyrics: event.target.value })}
                    />
                  </label>

                  {lyricLines.length > 0 ? (
                    <div className="surface-2 animate-pop mt-2 p-3">
                      <p className="text-[11px] font-bold">Suggested lines · click to use</p>
                      <div className="mt-1 space-y-1">
                        {lyricLines.map((line) => (
                          <button
                            key={line}
                            type="button"
                            className="muted block w-full rounded-lg px-2 py-1 text-left text-xs hover:brightness-125"
                            style={{ background: "var(--panel)" }}
                            onClick={() => setDraft({ ...draft, lyrics: `${draft.lyrics}\n${line}`.trim() })}
                          >
                            {line}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <label className="mt-3 block">
                    <span className="muted mb-1 block text-[11px] font-semibold">Release caption</span>
                    <input
                      className="field text-xs"
                      placeholder="the caption that ships with this drop…"
                      value={draft.caption}
                      onChange={(event) => setDraft({ ...draft, caption: event.target.value })}
                    />
                  </label>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="muted text-[11px] font-semibold">Cover</span>
                    <div className="flex flex-wrap gap-1">
                      {EMOJI_OPTIONS.slice(0, 10).map((emoji) => (
                        <button key={emoji} type="button" onClick={() => setDraft({ ...draft, emoji })} className={`chip ${draft.emoji === emoji ? "chip-active" : ""}`} style={{ padding: "0.18rem 0.4rem", fontSize: "0.8rem" }}>
                          {emoji}
                        </button>
                      ))}
                    </div>
                    <div className="ml-2 flex flex-wrap gap-1.5">
                      {createPostGradientOptions.map((gradient) => (
                        <button
                          key={gradient}
                          type="button"
                          aria-label="Cover gradient"
                          onClick={() => setDraft({ ...draft, gradient })}
                          className="h-5 w-5 rounded-full"
                          style={{ backgroundImage: gradient, outline: draft.gradient === gradient ? "2px solid var(--accent)" : "1px solid var(--border)", outlineOffset: 2 }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3" style={{ borderColor: "var(--border)" }}>
                    <button type="button" className="btn btn-primary btn-sm" onClick={save} disabled={pending}>
                      <PencilIcon size={13} /> {pending ? "Saving…" : "Save changes"}
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={publish} disabled={pending}>
                      <ZapIcon size={13} /> Publish to feed
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={askMix} disabled={pending}>
                      <MusicIcon size={13} /> AI mix notes
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        const sheet = [
                          `muse. session sheet`,
                          `title: ${draft.title}`,
                          `tempo: ${draft.bpm} BPM`,
                          `tone: ${draft.tone}`,
                          `vocals: ${draft.vocalStyle}`,
                          `completion: ${draft.progress}%`,
                          `description: ${draft.description}`,
                          ``,
                          `--- lyrics ---`,
                          draft.lyrics || "(empty)",
                          ``,
                          `--- caption ---`,
                          draft.caption || "(empty)",
                        ].join("\n");
                        downloadText(`${slugify(draft.title)}-session.txt`, sheet);
                        push("Session sheet exported as .txt");
                      }}
                    >
                      <DownloadIcon size={13} /> Export
                    </button>
                    {confirmDelete ? (
                      <div className="ml-auto flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold" style={{ color: "#fb7185" }}>Delete?</span>
                        <button type="button" className="btn btn-danger btn-sm" onClick={remove}>Yes</button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(false)}>No</button>
                      </div>
                    ) : (
                      <button type="button" className="btn btn-ghost btn-sm ml-auto" onClick={() => setConfirmDelete(true)} aria-label="Delete project">
                        <TrashIcon size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {mixTips.length > 0 ? (
                <div className="surface animate-pop p-4">
                  <p className="flex items-center gap-1.5 text-sm font-bold"><SparklesIcon size={15} /> Muse mix notes</p>
                  <ul className="mt-2 space-y-1.5">
                    {mixTips.map((tip) => (
                      <li key={tip} className="muted flex gap-2 text-xs leading-relaxed">
                        <span style={{ color: "var(--accent)" }}>✦</span> {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="surface flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-bold"><LockIcon size={14} /> Stem separation</p>
                  <p className="muted text-xs">Split vocals, drums, bass and keys. Included with Muse Plus.</p>
                </div>
                <a href="/marketplace" className="btn btn-secondary btn-sm shrink-0">
                  {viewer.plan === "free" ? "Unlock Plus" : "Run split"}
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
