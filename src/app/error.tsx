"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[muse] route error", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="text-5xl">🎛️</p>
      <h1 className="font-display mt-4 text-2xl font-bold sm:text-3xl">Something clipped in the studio</h1>
      <p className="muted mt-2 max-w-sm text-sm">
        That&apos;s on us, not your wifi. Retry the render — your saved work is untouched.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <button type="button" onClick={reset} className="btn btn-primary">Try again</button>
        <Link href="/dashboard" className="btn btn-secondary">Back to studio</Link>
      </div>
      {error.digest ? <p className="muted mt-4 text-[10px]">error ref · {error.digest}</p> : null}
    </div>
  );
}
