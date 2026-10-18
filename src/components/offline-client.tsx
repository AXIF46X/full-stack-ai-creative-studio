"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleProjectOffline } from "@/app/actions";
import { CloudOffIcon, DownloadIcon, MusicIcon, SparklesIcon, WandIcon, ZapIcon } from "@/components/icons";
import { CopyButton, EmptyState, useToast } from "@/components/ui";
import type { ProjectDTO } from "@/lib/types";

const CAPTION_TEMPLATES = [
  "recorded {topic} on a phone mic because the room sounded too good to waste 🫧",
  "{topic}, but make it unhinged. no notes.",
  "soft launch of {topic}. be gentle with her.",
  "3am brain said {topic}. i listened.",
  "the ${topic} demo is 12 seconds and i've played it 400 times.",
];

export function OfflineClient({ saved, total }: { saved: ProjectDTO[]; total: number }) {
  const router = useRouter();
  const { push } = useToast();
  const [pending, startTransition] = useTransition();
  const [offlineMode, setOfflineMode] = useState(false);
  const [online, setOnline] = useState(true);
  const [topic, setTopic] = useState("my new drop");
  const [captionIndex, setCaptionIndex] = useState(0);
  const [scratch, setScratch] = useState("");
  const [taps, setTaps] = useState<number[]>([]);

  useEffect(() => {
    setOnline(navigator.onLine);
    const stored = window.localStorage.getItem("muse-offline-mode");
    if (stored === "true") setOfflineMode(true);
    setScratch(window.localStorage.getItem("muse-scratchpad") ?? "");
    const onStatus = () => setOnline(navigator.onLine);
    window.addEventListener("online", onStatus);
    window.addEventListener("offline", onStatus);
    return () => {
      window.removeEventListener("online", onStatus);
      window.removeEventListener("offline", onStatus);
    };
  }, []);

  const toggleMode = () => {
    const next = !offlineMode;
    setOfflineMode(next);
    window.localStorage.setItem("muse-offline-mode", String(next));
    push(next ? "Offline mode on — saved work only" : "Back online", next ? "info" : "success");
  };

  const bpm = useMemo(() => {
    if (taps.length < 2) return null;
    const recent = taps.slice(-6);
    const gaps: number[] = [];
    for (let index = 1; index < recent.length; index += 1) gaps.push(recent[index] - recent[index - 1]);
    const average = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
    return Math.round(60000 / average);
  }, [taps]);

  const removeSaved = (project: ProjectDTO) => {
    startTransition(async () => {
      const result = await toggleProjectOffline(project.id);
      if (!result.ok) push(result.error ?? "Could not update", "error");
      else {
        push("Removed from offline pack");
        router.refresh();
      }
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
      <div className="space-y-4">
        <div className="surface p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="flex items-center gap-1.5 text-sm font-bold"><CloudOffIcon size={15} /> Offline mode</p>
              <p className="muted text-xs">
                {online ? "You're connected. Saved projects and tools are cached for the bus." : "You're offline — saved work and local tools still work."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="chip" style={{ color: online ? "#4ade80" : "#fbbf24" }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: online ? "#4ade80" : "#fbbf24" }} />
                {online ? "online" : "offline"}
              </span>
              <button type="button" onClick={toggleMode} className={`btn btn-sm ${offlineMode ? "btn-primary" : "btn-secondary"}`}>
                {offlineMode ? "Offline mode on" : "Enable offline mode"}
              </button>
            </div>
          </div>
        </div>

        <div className="surface p-4">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold">Saved projects</h2>
              <p className="muted text-xs">{saved.length} of {total} projects downloaded · syncs when you reconnect</p>
            </div>
            <Link href="/music" className="btn btn-secondary btn-sm"><MusicIcon size={13} /> Open studio</Link>
          </div>
          {saved.length === 0 ? (
            <EmptyState
              emoji="📥"
              title="Your offline pack is empty"
              body="Open a project in Music Studio and tap “Save offline” to keep it available without a connection."
              action={<Link href="/music" className="btn btn-primary btn-sm">Choose a project</Link>}
            />
          ) : (
            <div className="space-y-2">
              {saved.map((project) => (
                <div key={project.id} className="surface-2 flex items-center gap-3 p-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg text-base" style={{ backgroundImage: project.gradient }}>
                    {project.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">{project.title}</p>
                    <p className="muted text-[10px] capitalize">{project.kind} · {project.bpm} BPM · {project.progress}% complete</p>
                    <div className="progress mt-1 w-28">
                      <span style={{ width: `${Math.max(20, project.progress)}%` }} />
                    </div>
                  </div>
                  <span className="chip"><DownloadIcon size={11} /> cached</span>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeSaved(project)} disabled={pending}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="surface p-4">
          <h2 className="font-display flex items-center gap-1.5 text-base font-bold"><SparklesIcon size={15} /> Offline scratchpad</h2>
          <p className="muted text-xs">Saved in this browser — perfect for lyric fragments on the subway.</p>
          <textarea
            className="field mt-2 text-sm"
            rows={5}
            placeholder="I keep the bathroom light on repeat, repeat, repeat…"
            value={scratch}
            onChange={(event) => {
              setScratch(event.target.value);
              window.localStorage.setItem("muse-scratchpad", event.target.value);
            }}
          />
          <div className="mt-2 flex items-center gap-2">
            <span className="muted text-[10px]">{scratch.trim().split(/\s+/).filter(Boolean).length} words · autosaved locally</span>
            <div className="ml-auto"><CopyButton value={scratch} label="Copy notes" /></div>
          </div>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="surface p-4">
          <p className="flex items-center gap-1.5 text-sm font-bold"><WandIcon size={15} /> Local caption lab</p>
          <p className="muted mt-1 text-xs">Runs entirely in your browser — works with zero bars.</p>
          <input className="field mt-2 text-xs" value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="topic" />
          <div className="surface-2 mt-2 p-2.5">
            <p className="text-xs leading-relaxed">{CAPTION_TEMPLATES[captionIndex].replace("{topic}", topic || "this idea")}</p>
            <div className="mt-2 flex items-center gap-1">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setCaptionIndex((index) => (index + 1) % CAPTION_TEMPLATES.length)}>
                Shuffle
              </button>
              <CopyButton value={CAPTION_TEMPLATES[captionIndex].replace("{topic}", topic || "this idea")} />
            </div>
          </div>
        </div>

        <div className="surface p-4">
          <p className="flex items-center gap-1.5 text-sm font-bold"><ZapIcon size={15} /> Tap tempo</p>
          <p className="muted mt-1 text-xs">No internet needed. Tap along to your track.</p>
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setTaps((current) => [...current, Date.now()].slice(-10))}
              className="btn btn-primary h-16 w-16 rounded-full p-0 font-display text-lg"
            >
              TAP
            </button>
            <div>
              <p className="font-display text-2xl font-bold">{bpm ?? "—"} <span className="muted text-xs">BPM</span></p>
              <button type="button" className="muted text-[11px] font-semibold" onClick={() => setTaps([])}>reset</button>
            </div>
          </div>
        </div>

        <div className="surface p-4">
          <p className="text-sm font-bold">Also available offline</p>
          <ul className="muted mt-2 space-y-1 text-xs">
            <li>✦ Lyric scratchpad</li>
            <li>✦ Caption lab (templates)</li>
            <li>✦ Tap tempo + metronome math</li>
            <li>✦ Saved project details and lyrics</li>
          </ul>
          <p className="muted mt-2 text-[10px]">
            AI generation and community features need a connection. Saved work stays readable.
          </p>
        </div>
      </aside>
    </div>
  );
}
