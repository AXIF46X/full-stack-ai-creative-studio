"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { demoLoginAction, loginAction, signupAction } from "@/app/auth-actions";
import { ArrowRightIcon, SparklesIcon, ZapIcon } from "@/components/icons";

const INTERESTS = [
  "bedroom pop",
  "hyperpop",
  "lofi",
  "video editing",
  "streetwear",
  "photography",
  "memes",
  "3d design",
  "album art",
  "dance",
];

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [demoPending, startDemo] = useTransition();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [interests, setInterests] = useState<string[]>(["bedroom pop", "video editing"]);

  const toggleInterest = (interest: string) => {
    setInterests((current) =>
      current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest],
    );
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result =
        mode === "login" ? await loginAction({ email, password }) : await signupAction({ name, email, password, interests });
      if (result?.error) setError(result.error);
    });
  };

  const demo = () => {
    setError(null);
    startDemo(async () => {
      const result = await demoLoginAction();
      if (result?.error) setError(result.error);
    });
  };

  const busy = pending || demoPending;

  return (
    <div className="surface w-full max-w-md p-6 sm:p-7">
      <div className="mb-5">
        <span className="chip" style={{ color: "var(--accent)", borderColor: "color-mix(in srgb, var(--accent) 40%, transparent)" }}>
          <SparklesIcon size={13} /> {mode === "login" ? "welcome back" : "new here?"}
        </span>
        <h1 className="font-display mt-3 text-2xl font-bold">
          {mode === "login" ? "Log in to your studio" : "Build your studio"}
        </h1>
        <p className="muted mt-1 text-sm">
          {mode === "login"
            ? "Pick up where you left off — projects, streaks and drafts are waiting."
            : "One account for the music studio, creator tools and your people."}
        </p>
      </div>

      <form onSubmit={submit} className="space-y-3">
        {mode === "signup" ? (
          <label className="block">
            <span className="muted mb-1 block text-xs font-semibold">Name</span>
            <input
              className="field"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Maya Okonkwo"
              autoComplete="name"
              required
            />
          </label>
        ) : null}

        <label className="block">
          <span className="muted mb-1 block text-xs font-semibold">Email</span>
          <input
            className="field"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@studio.com"
            autoComplete="email"
            required
          />
        </label>

        <label className="block">
          <span className="muted mb-1 block text-xs font-semibold">Password</span>
          <input
            className="field"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={mode === "signup" ? "At least 6 characters" : "••••••••"}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
          />
        </label>

        {mode === "signup" ? (
          <div>
            <span className="muted mb-1 block text-xs font-semibold">What are you into?</span>
            <div className="flex flex-wrap gap-1.5">
              {INTERESTS.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`chip ${interests.includes(interest) ? "chip-active" : ""}`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {error ? (
          <p className="rounded-xl px-3 py-2 text-xs font-medium" style={{ background: "rgba(244,63,94,0.14)", color: "#fb7185" }}>
            {error}
          </p>
        ) : null}

        <button type="submit" className="btn btn-primary w-full py-2.5" disabled={busy}>
          {pending ? "Just a sec…" : mode === "login" ? "Log in" : "Create my studio"}
          {!pending ? <ArrowRightIcon size={15} /> : null}
        </button>
      </form>

      <div className="my-4 flex items-center gap-2">
        <div className="h-px flex-1" style={{ background: "var(--border)" }} />
        <span className="muted text-[10px] font-semibold tracking-wider uppercase">or</span>
        <div className="h-px flex-1" style={{ background: "var(--border)" }} />
      </div>

      <button type="button" onClick={demo} className="btn btn-secondary w-full py-2.5" disabled={busy}>
        <ZapIcon size={15} /> {demoPending ? "Loading demo…" : "Enter the demo studio"}
      </button>
      <p className="muted mt-2 text-center text-[11px]">
        Demo account: maya@muse.studio · demo1234 — fully loaded with projects, XP and friends.
      </p>

      <p className="muted mt-4 text-center text-xs">
        {mode === "login" ? (
          <>
            New here?{" "}
            <Link href="/signup" className="font-semibold" style={{ color: "var(--accent)" }}>
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have a studio?{" "}
            <Link href="/login" className="font-semibold" style={{ color: "var(--accent)" }}>
              Log in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
