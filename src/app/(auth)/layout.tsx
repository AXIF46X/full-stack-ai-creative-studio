import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth";
import { FlameIcon, MusicIcon, SparklesIcon, TrophyIcon, UsersIcon } from "@/components/icons";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-16 items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-2xl text-lg font-black text-white"
            style={{ backgroundImage: "linear-gradient(135deg,var(--accent),var(--accent-2))" }}
          >
            m
          </span>
          <span className="font-display text-lg font-bold">
            muse<span style={{ color: "var(--accent)" }}>.</span>
          </span>
        </Link>
        <Link href="/" className="muted text-xs font-semibold">
          ← Back to home
        </Link>
      </header>

      <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-8 px-4 py-6 sm:px-8 lg:grid-cols-2">
        <div className="order-2 lg:order-1">{children}</div>
        <div className="order-1 hidden lg:order-2 lg:block">
          <div
            className="noise relative overflow-hidden rounded-[32px] p-7 text-white"
            style={{ backgroundImage: "linear-gradient(145deg,var(--accent),var(--accent-2))", boxShadow: "var(--shadow)" }}
          >
            <div className="relative">
              <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold">the studio for your era</span>
              <h2 className="font-display mt-4 text-3xl leading-tight font-bold">
                Everything you need to post the thing you keep almost posting.
              </h2>
              <p className="mt-3 max-w-sm text-sm text-white/85">
                Muse blends an AI assistant, a music studio, creator tools and a community that actually
                replies. Your drafts don't have to stay drafts.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-2">
                {[
                  { icon: MusicIcon, label: "Music studio" },
                  { icon: SparklesIcon, label: "Muse AI" },
                  { icon: UsersIcon, label: "Communities" },
                  { icon: TrophyIcon, label: "XP & badges" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 rounded-xl bg-white/12 px-3 py-2 text-xs font-semibold">
                    <item.icon size={15} /> {item.label}
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl bg-black/25 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <FlameIcon size={14} /> Maya's streak update
                </div>
                <p className="mt-1.5 text-sm text-white/85">
                  “12 days. 5 drafts. Muse told me to finish the 72% one — so I did. It's my most-liked post.”
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-[11px]">🦋</span>
                  <span className="text-[11px] text-white/75">@mayaonmute · 2,480 XP</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
