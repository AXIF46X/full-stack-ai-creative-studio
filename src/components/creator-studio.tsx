"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createProject,
  deleteProject,
  generateAvatarSet,
  generateCaption,
  generateThumbnails,
  generateVideoIdeas,
  publishProject,
  saveAvatar,
  toggleProjectOffline,
  updateProject,
} from "@/app/actions";
import {
  CloudOffIcon,
  CopyIcon,
  DownloadIcon,
  PencilIcon,
  PlusIcon,
  SparklesIcon,
  TrashIcon,
  WandIcon,
  ZapIcon,
} from "@/components/icons";
import { CAPTION_TONES, EMOJI_OPTIONS, createPostGradientOptions } from "@/components/composer-options";
import { CopyButton, EmptyState, GradientArt, Modal, ProgressBar, useToast } from "@/components/ui";
import { downloadText, downloadThumbnail, slugify } from "@/lib/download";
import type { CurrentUser, GeneratedCaption, GeneratedIdea, GeneratedThumbnail, ProjectDTO } from "@/lib/types";

const TABS = [
  { value: "captions", label: "Captions", emoji: "💬" },
  { value: "thumbnails", label: "Thumbnails", emoji: "🖼️" },
  { value: "avatars", label: "Avatars", emoji: "🪩" },
  { value: "ideas", label: "Video ideas", emoji: "🎬" },
];

type EditingDraft = { id: number; title: string; caption: string; description: string; emoji: string; gradient: string; progress: number };

export function CreatorStudio({ viewer, projects }: { viewer: CurrentUser; projects: ProjectDTO[] }) {
  const router = useRouter();
  const { push } = useToast();
  const [tab, setTab] = useState("captions");
  const [topic, setTopic] = useState("my new bedroom pop single");
  const [captionTone, setCaptionTone] = useState("main character");
  const [thumbnailStyle, setThumbnailStyle] = useState("Chrome Y2K");
  const [captions, setCaptions] = useState<GeneratedCaption[]>([]);
  const [thumbnails, setThumbnails] = useState<GeneratedThumbnail[]>([]);
  const [ideas, setIdeas] = useState<GeneratedIdea[]>([]);
  const [avatarSet, setAvatarSet] = useState<{ emoji: string; gradient: string }[]>([]);
  const [avatarChoice, setAvatarChoice] = useState({ emoji: viewer.avatarEmoji, gradient: viewer.gradient });
  const [pending, startTransition] = useTransition();
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const [items, setItems] = useState(projects);
  const [editing, setEditing] = useState<EditingDraft | null>(null);
  const [cover, setCover] = useState<GeneratedThumbnail | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const generate = () => {
    if (!topic.trim()) {
      push("Add a topic first", "error");
      return;
    }
    setBusyLabel(tab);
    startTransition(async () => {
      if (tab === "captions") {
        const result = await generateCaption(topic, captionTone, viewer.interests);
        if (result.ok) setCaptions(result.captions ?? []);
        else push(result.error ?? "Could not generate", "error");
      }
      if (tab === "thumbnails") {
        const result = await generateThumbnails(topic, thumbnailStyle);
        if (result.ok) setThumbnails(result.thumbnails ?? []);
        else push(result.error ?? "Could not generate", "error");
      }
      if (tab === "ideas") {
        const result = await generateVideoIdeas(topic);
        if (result.ok) setIdeas(result.ideas ?? []);
        else push(result.error ?? "Could not generate", "error");
      }
      setBusyLabel(null);
    });
  };

  const loadAvatars = () => {
    startTransition(async () => {
      const result = await generateAvatarSet();
      if (result.ok) setAvatarSet(result.avatars ?? []);
      else push(result.error ?? "Could not load avatars", "error");
    });
  };

  const saveAvatarChoice = () => {
    startTransition(async () => {
      const result = await saveAvatar(avatarChoice);
      if (!result.ok) push(result.error ?? "Could not save avatar", "error");
      else {
        push("Avatar updated everywhere");
        router.refresh();
      }
    });
  };

  const saveAsProject = (input: { title: string; caption: string; description: string; emoji: string; gradient: string }) => {
    startTransition(async () => {
      const result = await createProject({ ...input, kind: "creator" });
      if (!result.ok) push(result.error ?? "Could not save", "error");
      else {
        push("Saved to Creator projects · +15 XP");
        router.refresh();
      }
    });
  };

  const remove = (id: number) => {
    setConfirmId(null);
    setItems((current) => current.filter((project) => project.id !== id));
    startTransition(async () => {
      const result = await deleteProject(id);
      if (!result.ok) push(result.error ?? "Could not delete", "error");
      else {
        push("Project deleted");
        router.refresh();
      }
    });
  };

  const saveEdit = () => {
    if (!editing) return;
    const payload = editing;
    setEditing(null);
    setItems((current) => current.map((project) => (project.id === payload.id ? { ...project, ...payload } : project)));
    startTransition(async () => {
      const result = await updateProject(payload.id, payload);
      if (!result.ok) push(result.error ?? "Could not save", "error");
      else {
        push("Project updated");
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="surface p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {TABS.map((option) => (
            <button key={option.value} type="button" onClick={() => setTab(option.value)} className={`chip ${tab === option.value ? "chip-active" : ""}`}>
              <span>{option.emoji}</span> {option.label}
            </button>
          ))}
          <span className="tag ml-auto hidden sm:inline-flex">
            <SparklesIcon size={11} /> {viewer.plan === "free" ? "Free generators" : `${viewer.plan} · HD exports`}
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            className="field flex-1 text-sm"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder={tab === "avatars" ? "Describe your vibe (used for avatar mood)" : "What are we making? e.g. my new bedroom pop single"}
          />
          {tab === "captions" ? (
            <select className="field sm:w-44" value={captionTone} onChange={(event) => setCaptionTone(event.target.value)}>
              {CAPTION_TONES.map((tone) => (
                <option key={tone} value={tone}>{tone}</option>
              ))}
            </select>
          ) : null}
          {tab === "thumbnails" ? (
            <select className="field sm:w-44" value={thumbnailStyle} onChange={(event) => setThumbnailStyle(event.target.value)}>
              {["Chrome Y2K", "Riso print", "Neon arcade", "Vapor collage", "Film scan"].map((style) => (
                <option key={style} value={style}>{style}</option>
              ))}
            </select>
          ) : null}
          <button type="button" className="btn btn-primary btn-sm sm:px-4" onClick={tab === "avatars" ? loadAvatars : generate} disabled={pending}>
            <WandIcon size={14} /> {pending && busyLabel === tab ? "Generating…" : tab === "avatars" ? "Shuffle avatars" : "Generate"}
          </button>
        </div>

        <div className="mt-4">
          {pending && busyLabel === tab ? (
            <div className="space-y-2">
              <div className="skeleton h-16 w-full" />
              <div className="skeleton h-16 w-full" />
              <div className="skeleton h-16 w-full" />
            </div>
          ) : null}

          {tab === "captions" ? (
            captions.length === 0 && !(pending && busyLabel === "captions") ? (
              <EmptyGen emoji="💬" text="Generate three caption directions tuned to your tone and interests." />
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="muted text-[11px] font-semibold">{captions.length} directions · {captionTone} tone</p>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      downloadText(
                        `${slugify(topic)}-captions.txt`,
                        captions.map((caption, index) => `${index + 1}. ${caption.text}\n${caption.hashtags.map((tag) => `#${tag}`).join(" ")}`).join("\n\n"),
                      );
                      push("Caption sheet downloaded");
                    }}
                  >
                    <DownloadIcon size={12} /> Export all
                  </button>
                </div>
                {captions.map((caption) => (
                  <div key={caption.text} className="surface-2 p-3">
                    <p className="text-sm leading-relaxed">{caption.text}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {caption.hashtags.map((tag) => (
                        <span key={tag} className="tag" style={{ color: "var(--accent)" }}>#{tag}</span>
                      ))}
                      <span className="muted text-[10px]">{caption.text.length} chars</span>
                      <div className="ml-auto flex items-center gap-1">
                        <CopyButton value={`${caption.text}\n\n${caption.hashtags.map((tag) => `#${tag}`).join(" ")}`} />
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() =>
                            saveAsProject({
                              title: caption.text.slice(0, 42),
                              caption: `${caption.text}\n\n${caption.hashtags.map((tag) => `#${tag}`).join(" ")}`,
                              description: `Caption direction generated in the ${caption.tone} tone.`,
                              emoji: "💬",
                              gradient: createPostGradientOptions[1],
                            })
                          }
                          disabled={pending}
                        >
                          <PlusIcon size={12} /> Save
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : null}

          {tab === "thumbnails" ? (
            thumbnails.length === 0 && !(pending && busyLabel === "thumbnails") ? (
              <EmptyGen emoji="🖼️" text="Describe the video and get three clickable cover concepts." />
            ) : (
              <div className="grid gap-2 sm:grid-cols-3">
                {thumbnails.map((thumb) => (
                  <div key={thumb.title} className="surface-2 overflow-hidden">
                    <button type="button" className="block w-full text-left" onClick={() => setCover(thumb)} aria-label={`Edit cover ${thumb.title}`}>
                      <GradientArt gradient={thumb.gradient} emoji={thumb.emoji} className="aspect-video w-full">
                        <div className="absolute inset-0 flex flex-col justify-end p-2 text-white">
                          <p className="font-display text-sm leading-tight font-black tracking-tight uppercase">{thumb.title}</p>
                          <p className="text-[9px] tracking-wide uppercase opacity-85">{thumb.subtitle}</p>
                        </div>
                        <span className="absolute top-1.5 left-1.5 rounded bg-black/40 px-1 text-[8px] font-bold text-white uppercase">{thumb.style}</span>
                        <span className="absolute top-1.5 right-1.5 rounded bg-black/40 px-1 text-[8px] font-bold text-white uppercase">edit</span>
                      </GradientArt>
                    </button>
                    <div className="flex items-center justify-between gap-1 p-1.5">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          const ok = downloadThumbnail({
                            title: thumb.title,
                            subtitle: thumb.subtitle,
                            gradient: thumb.gradient,
                            emoji: thumb.emoji,
                          });
                          push(ok ? "1280×720 PNG downloaded" : "Could not render that cover", ok ? "success" : "error");
                        }}
                        aria-label="Download cover PNG"
                      >
                        <DownloadIcon size={11} /> PNG
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() =>
                          saveAsProject({
                            title: thumb.title,
                            caption: `${thumb.title} — ${thumb.subtitle}`,
                            description: `Thumbnail concept in ${thumb.style}.`,
                            emoji: thumb.emoji,
                            gradient: thumb.gradient,
                          })
                        }
                        disabled={pending}
                      >
                        <PlusIcon size={11} /> Save
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : null}

          {tab === "avatars" ? (
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {avatarSet.length === 0 ? (
                  <p className="muted text-xs">Shuffle a fresh set, pick one, then save it to your profile.</p>
                ) : (
                  avatarSet.map((option) => (
                    <button
                      key={`${option.emoji}-${option.gradient}`}
                      type="button"
                      onClick={() => setAvatarChoice(option)}
                      className="flex h-14 w-14 items-center justify-center rounded-full text-xl transition hover:scale-105"
                      style={{
                        backgroundImage: option.gradient,
                        outline: avatarChoice.emoji === option.emoji && avatarChoice.gradient === option.gradient ? "2px solid var(--accent)" : "1px solid var(--border)",
                        outlineOffset: 2,
                      }}
                    >
                      {option.emoji}
                    </button>
                  ))
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full text-lg" style={{ backgroundImage: avatarChoice.gradient }}>
                    {avatarChoice.emoji}
                  </span>
                  <div>
                    <p className="text-xs font-semibold">Live preview</p>
                    <p className="muted text-[11px]">@{viewer.handle}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {EMOJI_OPTIONS.slice(0, 8).map((emoji) => (
                    <button key={emoji} type="button" onClick={() => setAvatarChoice({ ...avatarChoice, emoji })} className={`chip ${avatarChoice.emoji === emoji ? "chip-active" : ""}`} style={{ padding: "0.16rem 0.4rem" }}>
                      {emoji}
                    </button>
                  ))}
                </div>
                <button type="button" className="btn btn-primary btn-sm ml-auto" onClick={saveAvatarChoice} disabled={pending}>
                  Use this avatar
                </button>
              </div>
            </div>
          ) : null}

          {tab === "ideas" ? (
            ideas.length === 0 && !(pending && busyLabel === "ideas") ? (
              <EmptyGen emoji="🎬" text="Get short-video hooks, shot lists and sound suggestions for your next post." />
            ) : (
              <div className="grid gap-2 sm:grid-cols-3">
                {ideas.map((idea) => (
                  <div key={idea.hook} className="surface-2 flex flex-col p-3">
                    <p className="text-sm font-semibold">{idea.hook}</p>
                    <p className="muted mt-1 text-[11px]"><span className="font-semibold" style={{ color: "var(--accent)" }}>{idea.format}</span> · {idea.sound}</p>
                    <ul className="muted mt-2 space-y-1 text-[11px]">
                      {idea.beats.map((beat) => (
                        <li key={beat}>• {beat}</li>
                      ))}
                    </ul>
                    <div className="mt-auto flex items-center gap-1 pt-2">
                      <CopyButton value={`${idea.hook}\n${idea.format}\n${idea.beats.join("\n")}\nSound: ${idea.sound}`} label="Copy" />
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() =>
                          saveAsProject({
                            title: idea.hook.slice(0, 40),
                            caption: idea.hook,
                            description: `${idea.format} · ${idea.sound}`,
                            emoji: "🎬",
                            gradient: createPostGradientOptions[2],
                          })
                        }
                        disabled={pending}
                      >
                        <PlusIcon size={11} /> Save
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : null}
        </div>
      </div>

      <div className="surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-bold">Creator projects</h2>
            <p className="muted text-xs">Captions, covers and ideas you saved · fully editable</p>
          </div>
          <span className="chip">{items.length} saved</span>
        </div>

        {items.length === 0 ? (
          <EmptyState emoji="🪄" title="No creator projects yet" body="Generate a caption or thumbnail above and hit Save — it lands here as an editable project." />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((project) => (
              <div key={project.id} className="surface-2 overflow-hidden">
                <div className="relative flex h-24 items-end p-2" style={{ backgroundImage: project.gradient }}>
                  <span className="absolute top-2 right-2 rounded-full bg-black/35 px-2 py-0.5 text-[9px] font-bold text-white uppercase">
                    {project.status.replace("_", " ")}
                  </span>
                  <span className="text-2xl">{project.emoji}</span>
                </div>
                <div className="p-2.5">
                  <p className="truncate text-xs font-semibold">{project.title}</p>
                  <p className="muted line-clamp-2 text-[11px]">{project.caption || project.description}</p>
                  <ProgressBar value={project.progress} className="mt-2" />
                  <div className="mt-2 flex items-center gap-1">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() =>
                        setEditing({
                          id: project.id,
                          title: project.title,
                          caption: project.caption,
                          description: project.description,
                          emoji: project.emoji,
                          gradient: project.gradient,
                          progress: project.progress,
                        })
                      }
                    >
                      <PencilIcon size={11} /> Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        startTransition(async () => {
                          const result = await publishProject(project.id);
                          if (!result.ok) push(result.error ?? "Could not publish", "error");
                          else {
                            push("Published · +60 XP");
                            router.refresh();
                          }
                        });
                      }}
                      disabled={pending}
                    >
                      <ZapIcon size={11} /> Post
                    </button>
                    <button
                      type="button"
                      className={`btn btn-ghost btn-sm ${project.savedOffline ? "accent-text" : ""}`}
                      onClick={() => {
                        startTransition(async () => {
                          const result = await toggleProjectOffline(project.id);
                          if (!result.ok) push(result.error ?? "Could not update", "error");
                          else {
                            push(project.savedOffline ? "Removed from offline" : "Saved offline");
                            router.refresh();
                          }
                        });
                      }}
                      aria-label="Toggle offline"
                    >
                      <CloudOffIcon size={12} />
                    </button>
                    {confirmId === project.id ? (
                      <div className="ml-auto flex items-center gap-1">
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(project.id)}>Delete</button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmId(null)}>No</button>
                      </div>
                    ) : (
                      <button type="button" className="btn btn-ghost btn-sm ml-auto" onClick={() => setConfirmId(project.id)} aria-label="Delete project">
                        <TrashIcon size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={Boolean(cover)}
        onClose={() => setCover(null)}
        title="Cover editor"
        subtitle="Tweak the type, then export a real 1280×720 PNG."
        footer={
          <>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCover(null)}>Close</button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                if (!cover) return;
                saveAsProject({
                  title: cover.title,
                  caption: `${cover.title} — ${cover.subtitle}`,
                  description: `Cover concept · ${cover.style}`,
                  emoji: cover.emoji,
                  gradient: cover.gradient,
                });
                setCover(null);
              }}
              disabled={pending}
            >
              <PlusIcon size={12} /> Save project
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                if (!cover) return;
                const ok = downloadThumbnail(cover);
                push(ok ? "PNG exported — go post it" : "Export failed in this browser", ok ? "success" : "error");
              }}
            >
              <DownloadIcon size={12} /> Download PNG
            </button>
          </>
        }
      >
        {cover ? (
          <div className="space-y-3">
            <GradientArt gradient={cover.gradient} emoji={cover.emoji} className="aspect-video w-full rounded-xl">
              <div className="absolute inset-0 flex flex-col justify-end p-3 text-white">
                <p className="font-display text-lg leading-tight font-black tracking-tight uppercase">{cover.title}</p>
                <p className="text-[10px] tracking-wide uppercase opacity-85">{cover.subtitle}</p>
              </div>
            </GradientArt>
            <label className="block">
              <span className="muted mb-1 block text-[11px] font-semibold">Big type</span>
              <input className="field text-sm" value={cover.title} onChange={(event) => setCover({ ...cover, title: event.target.value.toUpperCase() })} />
            </label>
            <label className="block">
              <span className="muted mb-1 block text-[11px] font-semibold">Subtitle</span>
              <input className="field text-sm" value={cover.subtitle} onChange={(event) => setCover({ ...cover, subtitle: event.target.value })} />
            </label>
            <div>
              <span className="muted mb-1 block text-[11px] font-semibold">Accent</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {EMOJI_OPTIONS.slice(0, 8).map((emoji) => (
                  <button key={emoji} type="button" onClick={() => setCover({ ...cover, emoji })} className={`chip ${cover.emoji === emoji ? "chip-active" : ""}`} style={{ padding: "0.16rem 0.4rem" }}>{emoji}</button>
                ))}
                <span className="mx-1" />
                {createPostGradientOptions.map((gradient) => (
                  <button
                    key={gradient}
                    type="button"
                    aria-label="Cover gradient"
                    onClick={() => setCover({ ...cover, gradient })}
                    className="h-6 w-6 rounded-full"
                    style={{ backgroundImage: gradient, outline: cover.gradient === gradient ? "2px solid var(--accent)" : "1px solid var(--border)", outlineOffset: 2 }}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Edit creator project"
        subtitle="Changes save to your studio instantly."
        footer={
          <>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>Cancel</button>
            <button type="button" className="btn btn-primary btn-sm" onClick={saveEdit} disabled={pending}>Save project</button>
          </>
        }
      >
        {editing ? (
          <div className="space-y-3">
            <label className="block">
              <span className="muted mb-1 block text-[11px] font-semibold">Title</span>
              <input className="field" value={editing.title} onChange={(event) => setEditing({ ...editing, title: event.target.value })} />
            </label>
            <label className="block">
              <span className="muted mb-1 block text-[11px] font-semibold">Caption / content</span>
              <textarea className="field" rows={4} value={editing.caption} onChange={(event) => setEditing({ ...editing, caption: event.target.value })} />
            </label>
            <label className="block">
              <span className="muted mb-1 block text-[11px] font-semibold">Notes</span>
              <input className="field" value={editing.description} onChange={(event) => setEditing({ ...editing, description: event.target.value })} />
            </label>
            <label className="block">
              <span className="muted mb-1 flex justify-between text-[11px] font-semibold"><span>Completion</span><span>{editing.progress}%</span></span>
              <input type="range" min={0} max={100} value={editing.progress} onChange={(event) => setEditing({ ...editing, progress: Number(event.target.value) })} className="w-full" />
            </label>
            <div>
              <span className="muted mb-1 block text-[11px] font-semibold">Cover</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {EMOJI_OPTIONS.slice(0, 8).map((emoji) => (
                  <button key={emoji} type="button" onClick={() => setEditing({ ...editing, emoji })} className={`chip ${editing.emoji === emoji ? "chip-active" : ""}`} style={{ padding: "0.16rem 0.4rem" }}>{emoji}</button>
                ))}
                <span className="mx-1" />
                {createPostGradientOptions.map((gradient) => (
                  <button
                    key={gradient}
                    type="button"
                    aria-label="Cover gradient"
                    onClick={() => setEditing({ ...editing, gradient })}
                    className="h-5 w-5 rounded-full"
                    style={{ backgroundImage: gradient, outline: editing.gradient === gradient ? "2px solid var(--accent)" : "1px solid var(--border)", outlineOffset: 2 }}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function EmptyGen({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="surface-2 flex flex-col items-center justify-center gap-1 px-4 py-8 text-center">
      <span className="text-2xl">{emoji}</span>
      <p className="muted max-w-sm text-xs">{text}</p>
      <span className="muted mt-1 flex items-center gap-1 text-[10px]"><CopyIcon size={10} /> nothing generated yet</span>
    </div>
  );
}
