"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[muse] studio error", error);
  }, [error]);

  return (
    <div className="surface mx-auto max-w-lg p-8 text-center">
      <p className="text-4xl">🎚️</p>
      <h1 className="font-display mt-3 text-xl font-bold">That take didn&apos;t render</h1>
      <p className="muted mt-2 text-sm">
        Retry — your projects, drafts and streak are safe. If it keeps happening, head back to the dashboard.
      </p>
      <div className="mt-4 flex items-center justify-center gap-2">
        <button type="button" onClick={reset} className="btn btn-primary btn-sm">Retry</button>
        <Link href="/dashboard" className="btn btn-secondary btn-sm">Dashboard</Link>
      </div>
    </div>
  );
}
