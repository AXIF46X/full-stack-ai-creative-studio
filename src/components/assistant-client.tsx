"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clearAssistant, sendAssistantMessage } from "@/app/actions";
import { SendIcon, SparklesIcon, TrashIcon, WandIcon, ZapIcon } from "@/components/icons";
import { Avatar, useToast } from "@/components/ui";
import { timeAgo } from "@/lib/format";
import type { AssistantMessageDTO, CurrentUser } from "@/lib/types";

type Bubble = AssistantMessageDTO & { pending?: boolean };

export function AssistantClient({
  viewer,
  messages,
  context,
}: {
  viewer: CurrentUser;
  messages: AssistantMessageDTO[];
  context: { projects: number; drafts: number; groups: number; challenges: number };
}) {
  const router = useRouter();
  const { push } = useToast();
  const [bubbles, setBubbles] = useState<Bubble[]>(messages);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [pending, startTransition] = useTransition();
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setBubbles(messages);
  }, [messages]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [bubbles, thinking]);

  const prompts = [
    `Write a caption for my ${viewer.interests[0] ?? "new track"}`,
    "What's trending in my niche?",
    "Help me mix airy vocals",
    "What should I post today?",
    "Plan my week of content",
    "How do I get more comments?",
  ];

  const send = (text: string) => {
    const clean = text.trim();
    if (!clean || thinking) return;
    const temp: Bubble = {
      id: -Date.now(),
      role: "user",
      content: clean,
      createdLabel: "just now",
      pending: true,
    };
    setBubbles((current) => [...current, temp]);
    setInput("");
    setThinking(true);
    startTransition(async () => {
      const result = await sendAssistantMessage(clean);
      setThinking(false);
      if (!result.ok) {
        push(result.error ?? "Muse is offline for a second", "error");
        setBubbles((current) => current.filter((bubble) => bubble.id !== temp.id));
        return;
      }
      setBubbles((current) => [
        ...current,
        {
          id: temp.id - 1,
          role: "assistant",
          content: result.reply ?? "",
          createdLabel: timeAgo(new Date()),
        },
      ]);
      router.refresh();
    });
  };

  const reset = () => {
    startTransition(async () => {
      const result = await clearAssistant();
      if (!result.ok) push(result.error ?? "Could not clear chat", "error");
      else {
        push("Chat cleared");
        router.refresh();
      }
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_310px]">
      <div className="surface flex h-[calc(100dvh-290px)] min-h-[420px] flex-col overflow-hidden lg:h-[calc(100dvh-190px)]">
        <div className="flex items-center gap-2.5 border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
            style={{ backgroundImage: "linear-gradient(135deg,var(--accent),var(--accent-2))" }}
          >
            <SparklesIcon size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">Muse AI</p>
            <p className="muted flex items-center gap-1 text-[11px]">
              <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: "#4ade80" }} />
              knows your {context.projects} projects & {context.groups} communities
            </p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={reset} disabled={pending}>
            <TrashIcon size={13} /> Clear
          </button>
        </div>

        <div ref={scroller} className="scroll-thin flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {bubbles.map((bubble) => (
            <div key={bubble.id} className={`flex items-start gap-2 ${bubble.role === "user" ? "justify-end" : ""}`}>
              {bubble.role === "assistant" ? (
                <span
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white"
                  style={{ backgroundImage: "linear-gradient(135deg,var(--accent),var(--accent-2))" }}
                >
                  <SparklesIcon size={13} />
                </span>
              ) : null}
              <div
                className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line"
                style={
                  bubble.role === "user"
                    ? { backgroundImage: "linear-gradient(120deg,var(--accent),var(--accent-2))", color: "#fff", opacity: bubble.pending ? 0.75 : 1 }
                    : { background: "var(--panel-2)", border: "1px solid var(--border)" }
                }
              >
                {bubble.content}
              </div>
              {bubble.role === "user" ? (
                <Avatar emoji={viewer.avatarEmoji} gradient={viewer.gradient} size={28} />
              ) : null}
            </div>
          ))}

          {thinking ? (
            <div className="flex items-center gap-2">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-lg text-white"
                style={{ backgroundImage: "linear-gradient(135deg,var(--accent),var(--accent-2))" }}
              >
                <SparklesIcon size={13} />
              </span>
              <div className="flex items-center gap-1 rounded-2xl px-3.5 py-3" style={{ background: "var(--panel-2)", border: "1px solid var(--border)" }}>
                {[0, 1, 2].map((dot) => (
                  <span
                    key={dot}
                    className="typing-dot h-1.5 w-1.5 rounded-full"
                    style={{ background: "var(--accent)", animationDelay: `${dot * 0.15}s` }}
                  />
                ))}
                <span className="muted ml-1 text-[11px]">Muse is thinking</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="border-t px-3 pt-2 pb-3" style={{ borderColor: "var(--border)" }}>
          <div className="hide-scrollbar mb-2 flex gap-1.5 overflow-x-auto">
            {prompts.slice(0, 4).map((prompt) => (
              <button key={prompt} type="button" className="chip shrink-0" onClick={() => send(prompt)} disabled={thinking}>
                {prompt}
              </button>
            ))}
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              send(input);
            }}
            className="flex items-end gap-2"
          >
            <textarea
              className="field max-h-32 min-h-[44px] flex-1 py-2.5 text-sm"
              rows={1}
              placeholder="Ask Muse anything — captions, mixes, trends, plans…"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  send(input);
                }
              }}
            />
            <button type="submit" className="btn btn-primary h-11 w-11 shrink-0 p-0" disabled={thinking || !input.trim()} aria-label="Send message">
              <SendIcon size={17} />
            </button>
          </form>
          <p className="muted mt-1.5 text-center text-[10px]">
            Muse uses your interests and studio data. Turn off personalization in Settings → Safety.
          </p>
        </div>
      </div>

      <aside className="space-y-3">
        <div className="surface p-4">
          <p className="text-sm font-bold">What Muse knows</p>
          <div className="mt-2 space-y-1.5">
            {[
              { label: "Projects in studio", value: context.projects },
              { label: "Drafts in progress", value: context.drafts },
              { label: "Communities joined", value: context.groups },
              { label: "Challenges to claim", value: context.challenges },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between text-xs">
                <span className="muted">{row.label}</span>
                <span className="font-semibold">{row.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {viewer.interests.map((interest) => (
              <span key={interest} className="tag" style={{ color: "var(--accent)" }}>{interest}</span>
            ))}
          </div>
        </div>

        <div className="surface p-4">
          <p className="flex items-center gap-1.5 text-sm font-bold"><ZapIcon size={14} /> Put ideas to work</p>
          <div className="mt-2 space-y-1.5">
            <Link href="/music" className="nav-link"><WandIcon size={15} /> Open Music Studio</Link>
            <Link href="/creator" className="nav-link"><WandIcon size={15} /> Generate creator assets</Link>
            <Link href="/discover" className="nav-link"><SparklesIcon size={15} /> Ride a trend</Link>
            <Link href="/quests" className="nav-link"><ZapIcon size={15} /> Claim daily XP</Link>
          </div>
        </div>

        <div className="surface p-4" style={{ backgroundImage: "linear-gradient(140deg, var(--accent-soft), transparent)" }}>
          <p className="text-sm font-bold">Prompt like a pro</p>
          <p className="muted mt-1 text-xs leading-relaxed">
            “Give me a 15-second hook for a bedroom pop track about missing the bus, in a deadpan tone.”
          </p>
          <button type="button" className="btn btn-primary btn-sm mt-2 w-full" onClick={() => send("Give me a 15-second hook for a bedroom pop track about missing the bus, in a deadpan tone")}>
            Try this prompt
          </button>
        </div>
      </aside>
    </div>
  );
}
