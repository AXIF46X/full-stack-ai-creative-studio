import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="text-5xl">🫥</p>
      <h1 className="font-display mt-4 text-3xl font-bold">This page didn&apos;t make the final cut</h1>
      <p className="muted mt-2 max-w-sm text-sm">
        The link is broken, the drop got pulled, or you typed it at 3am. Let&apos;s get you back to the studio.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <Link href="/dashboard" className="btn btn-primary">Back to studio</Link>
        <Link href="/discover" className="btn btn-secondary">Explore trends</Link>
      </div>
    </div>
  );
}
