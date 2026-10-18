"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeChallenge } from "@/app/actions";
import { CheckIcon, FlameIcon, ZapIcon } from "@/components/icons";
import { useToast } from "@/components/ui";
import { compactNumber } from "@/lib/format";
import type { ChallengeDTO } from "@/lib/types";

export function ChallengeCard({ challenge, compact = false }: { challenge: ChallengeDTO; compact?: boolean }) {
  const router = useRouter();
  const { push } = useToast();
  const [done, setDone] = useState(challenge.done);
  const [pending, startTransition] = useTransition();

  const complete = () => {
    if (done) return;
    setDone(true);
    startTransition(async () => {
      const result = await completeChallenge(challenge.id);
      if (!result.ok) {
        setDone(false);
        push(result.error ?? "Could not complete that challenge", "error");
      } else {
        push(`+${challenge.xp} XP · streak extended 🔥`);
        router.refresh();
      }
    });
  };

  return (
    <div
      className="surface-2 flex items-start gap-3 p-3 transition"
      style={{ opacity: done ? 0.7 : 1, borderColor: done ? "color-mix(in srgb, var(--accent) 45%, var(--border))" : undefined }}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base"
        style={{ background: done ? "var(--accent-soft)" : "var(--panel-3)" }}
      >
        {challenge.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{challenge.title}</p>
        {!compact ? <p className="muted mt-0.5 text-xs leading-relaxed">{challenge.description}</p> : null}
        <div className="muted mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
          <span className="flex items-center gap-1 font-semibold" style={{ color: "var(--accent)" }}>
            <ZapIcon size={11} /> {challenge.xp} XP
          </span>
          <span className="flex items-center gap-1">
            <FlameIcon size={11} /> {compactNumber(challenge.completions)} done
          </span>
          <span className="tag capitalize">{challenge.category}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={complete}
        disabled={done || pending}
        className={`btn btn-sm ${done ? "btn-secondary" : "btn-primary"}`}
        aria-label={done ? "Completed" : `Complete ${challenge.title}`}
      >
        {done ? <CheckIcon size={13} /> : "Do it"}
      </button>
    </div>
  );
}
