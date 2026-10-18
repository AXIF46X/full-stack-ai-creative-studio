"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { logoutAction } from "@/app/auth-actions";
import {
  BellIcon,
  CloudOffIcon,
  CompassIcon,
  FeedIcon,
  FlameIcon,
  GridIcon,
  HomeIcon,
  LogOutIcon,
  MenuIcon,
  MoonIcon,
  MusicIcon,
  SearchIcon,
  SettingsIcon,
  SparklesIcon,
  StoreIcon,
  SunIcon,
  TrophyIcon,
  UsersIcon,
  WandIcon,
  XIcon,
  ZapIcon,
} from "@/components/icons";
import { SearchPalette } from "@/components/search-palette";
import { Avatar } from "@/components/ui";
import { levelInfo } from "@/lib/format";
import type { CurrentUser } from "@/lib/types";

const NAV = [
  {
    label: "Daily",
    items: [
      { href: "/dashboard", label: "Home", icon: HomeIcon },
      { href: "/assistant", label: "Muse AI", icon: SparklesIcon, badge: "AI" },
    ],
  },
  {
    label: "Create",
    items: [
      { href: "/music", label: "Music Studio", icon: MusicIcon },
      { href: "/creator", label: "Creator Studio", icon: WandIcon },
    ],
  },
  {
    label: "Social",
    items: [
      { href: "/feed", label: "Feed", icon: FeedIcon },
      { href: "/community", label: "Community", icon: UsersIcon },
      { href: "/discover", label: "Discover", icon: CompassIcon },
    ],
  },
  {
    label: "You",
    items: [
      { href: "/quests", label: "Quests & XP", icon: TrophyIcon },
      { href: "/marketplace", label: "Marketplace", icon: StoreIcon },
      { href: "/offline", label: "Offline Mode", icon: CloudOffIcon },
      { href: "/settings", label: "Settings", icon: SettingsIcon },
    ],
  },
];

const MOBILE_NAV = [
  { href: "/dashboard", label: "Home", icon: HomeIcon },
  { href: "/feed", label: "Feed", icon: FeedIcon },
  { href: "/assistant", label: "Muse", icon: SparklesIcon },
  { href: "/discover", label: "Explore", icon: CompassIcon },
  { href: "/quests", label: "Quests", icon: TrophyIcon },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5">
      <span
        className="flex h-9 w-9 items-center justify-center rounded-2xl text-base font-black text-white"
        style={{ backgroundImage: "linear-gradient(135deg,var(--accent),var(--accent-2))" }}
      >
        m
      </span>
      <span className="font-display text-lg font-bold tracking-tight">
        muse<span style={{ color: "var(--accent)" }}>.</span>
      </span>
    </Link>
  );
}

export function AppShell({ user, children }: { user: CurrentUser; children: ReactNode }) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [theme, setTheme] = useState(user.theme === "light" ? "light" : "dark");
  const { level, percent, toNext } = levelInfo(user.xp);

  useEffect(() => {
    const stored = window.localStorage.getItem("muse-theme");
    const nextTheme = stored === "light" || stored === "dark" ? stored : user.theme === "light" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    const storedAccent = window.localStorage.getItem("muse-accent");
    document.documentElement.dataset.accent = storedAccent ?? user.accent;
  }, [user.accent, user.theme]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("muse-theme", next);
  };

  const sidebarInner = (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between px-2 pt-1">
        <Brand />
        <button type="button" className="btn-icon lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Close menu">
          <XIcon size={16} />
        </button>
      </div>

      <button
        type="button"
        onClick={() => {
          setSearchOpen(true);
          setMenuOpen(false);
        }}
        className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition hover:brightness-110"
        style={{ background: "var(--panel-2)", borderColor: "var(--border)", color: "var(--muted)" }}
      >
        <SearchIcon size={15} />
        <span className="flex-1 text-left">Search everything</span>
        <kbd className="rounded border px-1 text-[10px]" style={{ borderColor: "var(--border)" }}>
          ⌘K
        </kbd>
      </button>

      <nav className="scroll-thin flex-1 space-y-4 overflow-y-auto pb-2">
        {NAV.map((group) => (
          <div key={group.label}>
            <p className="mb-1 px-3 text-[10px] font-bold tracking-[0.16em] uppercase" style={{ color: "var(--muted)" }}>
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-link ${active ? "nav-link-active" : ""}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <item.icon size={17} />
                    <span className="flex-1">{item.label}</span>
                    {"badge" in item && item.badge ? (
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                        style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
                      >
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="surface-2 space-y-2 p-3">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="flex items-center gap-1.5">
            <ZapIcon size={14} style={{ color: "var(--accent)" }} /> Level {level}
          </span>
          <span className="muted">{user.xp} XP</span>
        </div>
        <div className="progress">
          <span style={{ width: `${percent}%` }} />
        </div>
        <div className="muted flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1">
            <FlameIcon size={12} style={{ color: "#fb923c" }} /> {user.streak}-day streak
          </span>
          <span>{toNext} to go</span>
        </div>
      </div>

      <div className="surface-2 flex items-center gap-2.5 p-2.5">
        <Avatar emoji={user.avatarEmoji} gradient={user.gradient} size={34} ring />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold">{user.name}</p>
          <p className="muted truncate text-[11px]">@{user.handle}</p>
        </div>
        <Link href="/marketplace" className="chip" style={{ padding: "0.15rem 0.5rem", fontSize: "0.62rem" }}>
          {user.plan.toUpperCase()}
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh">
      {/* desktop sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden w-[252px] flex-col border-r px-3 py-4 lg:flex"
        style={{ borderColor: "var(--border)", background: "color-mix(in srgb, var(--panel) 70%, transparent)", backdropFilter: "blur(18px)" }}
      >
        {sidebarInner}
      </aside>

      {/* mobile drawer */}
      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Close" className="absolute inset-0 bg-black/60" onClick={() => setMenuOpen(false)} />
          <div
            className="animate-pop absolute inset-y-0 left-0 w-[290px] border-r px-3 py-4"
            style={{ background: "var(--panel)", borderColor: "var(--border)" }}
          >
            {sidebarInner}
          </div>
        </div>
      ) : null}

      <div className="lg:pl-[252px]">
        <header
          className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b px-4 lg:px-8"
          style={{
            borderColor: "var(--border)",
            background: "color-mix(in srgb, var(--bg) 82%, transparent)",
            backdropFilter: "blur(16px)",
          }}
        >
          <button type="button" className="btn-icon lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <MenuIcon size={17} />
          </button>
          <div className="lg:hidden">
            <Brand />
          </div>

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="ml-1 hidden max-w-sm flex-1 items-center gap-2 rounded-full border px-3.5 py-2 text-sm sm:flex"
            style={{ background: "var(--panel)", borderColor: "var(--border)", color: "var(--muted)" }}
          >
            <SearchIcon size={15} />
            <span className="flex-1 text-left">Search creators, sounds, tools…</span>
            <span className="rounded border px-1 text-[10px]" style={{ borderColor: "var(--border)" }}>
              ⌘K
            </span>
          </button>

          <div className="ml-auto flex items-center gap-1.5">
            <span className="chip hidden sm:inline-flex" style={{ color: "var(--accent)", borderColor: "color-mix(in srgb, var(--accent) 35%, transparent)" }}>
              <SparklesIcon size={13} /> {user.plan === "free" ? "Free plan" : `Muse ${user.plan}`}
            </span>
            <span className="chip hidden md:inline-flex">
              <FlameIcon size={13} style={{ color: "#fb923c" }} /> {user.streak}
            </span>
            <Link href="/quests" className="btn-icon" aria-label="Quests">
              <BellIcon size={16} />
            </Link>
            <button type="button" onClick={toggleTheme} className="btn-icon" aria-label="Toggle theme">
              {theme === "dark" ? <SunIcon size={16} /> : <MoonIcon size={16} />}
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setAccountOpen((open) => !open)}
                className="flex items-center gap-2 rounded-full border p-1 pr-2 transition hover:brightness-110"
                style={{ borderColor: "var(--border)", background: "var(--panel)" }}
                aria-label="Account menu"
              >
                <Avatar emoji={user.avatarEmoji} gradient={user.gradient} size={28} />
                <span className="hidden text-xs font-semibold sm:inline">@{user.handle}</span>
              </button>
              {accountOpen ? (
                <>
                  <button type="button" className="fixed inset-0 z-10 cursor-default" aria-label="Close menu" onClick={() => setAccountOpen(false)} />
                  <div className="surface animate-pop absolute right-0 z-20 mt-2 w-60 overflow-hidden p-2">
                    <div className="flex items-center gap-2.5 px-2 py-2">
                      <Avatar emoji={user.avatarEmoji} gradient={user.gradient} size={36} ring />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{user.name}</p>
                        <p className="muted truncate text-xs">{user.email}</p>
                      </div>
                    </div>
                    <div className="my-1 h-px" style={{ background: "var(--border)" }} />
                    <Link href="/settings" className="nav-link" onClick={() => setAccountOpen(false)}>
                      <SettingsIcon size={16} /> Settings
                    </Link>
                    <Link href="/marketplace" className="nav-link" onClick={() => setAccountOpen(false)}>
                      <GridIcon size={16} /> Plans & marketplace
                    </Link>
                    <Link href="/offline" className="nav-link" onClick={() => setAccountOpen(false)}>
                      <CloudOffIcon size={16} /> Offline mode
                    </Link>
                    <form action={logoutAction}>
                      <button type="submit" className="nav-link w-full cursor-pointer text-left">
                        <LogOutIcon size={16} /> Log out
                      </button>
                    </form>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1180px] px-4 pt-5 pb-28 lg:px-8 lg:pb-12">{children}</main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t px-2 py-1.5 lg:hidden"
        style={{
          borderColor: "var(--border)",
          background: "color-mix(in srgb, var(--panel) 92%, transparent)",
          backdropFilter: "blur(16px)",
          paddingBottom: "max(0.375rem, env(safe-area-inset-bottom))",
        }}
      >
        {MOBILE_NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] font-semibold"
              style={{ color: active ? "var(--accent)" : "var(--muted)", background: active ? "var(--accent-soft)" : "transparent" }}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
