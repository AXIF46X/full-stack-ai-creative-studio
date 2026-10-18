"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { logoutAction } from "@/app/auth-actions";
import { createReport, saveAppearance, saveAvatar, savePrivacy, saveProfile, toggleBlock } from "@/app/actions";
import { INTEREST_OPTIONS, createPostGradientOptions, EMOJI_OPTIONS } from "@/components/composer-options";
import { CheckIcon, LogOutIcon, PaletteIcon, ShieldIcon, SparklesIcon, SunIcon, MoonIcon, ReportIcon, TrashIcon } from "@/components/icons";
import { Avatar, useToast } from "@/components/ui";
import type { CurrentUser } from "@/lib/types";

type BlockedUser = { id: number; name: string; handle: string; emoji: string; gradient: string };
type Report = { id: number; target: string; reason: string; status: string; createdLabel: string };

const PRIVACY_OPTIONS = [
  { key: "privateAccount", label: "Private account", body: "Hide unpublished projects and drafts from Discover." },
  { key: "allowComments", label: "Allow comments", body: "Let people reply on your posts and creations." },
  { key: "showActivity", label: "Show activity status", body: "Display your streak and XP on your profile." },
  { key: "aiPersonalization", label: "AI personalization", body: "Use your interests and history to tune recommendations." },
  { key: "offlineSync", label: "Offline auto-sync", body: "Keep saved projects available without a connection." },
];

const ACCENTS = [
  { key: "violet", from: "#8b5cf6", to: "#ec4899", label: "Violet hour" },
  { key: "cyan", from: "#22d3ee", to: "#6366f1", label: "Chrome" },
  { key: "lime", from: "#a3e635", to: "#22d3ee", label: "Acid" },
  { key: "sunset", from: "#fb923c", to: "#ec4899", label: "Sunset" },
  { key: "gold", from: "#fbbf24", to: "#a855f7", label: "Gold rush" },
];

export function SettingsClient({
  viewer,
  blocked,
  reports,
  blockable,
}: {
  viewer: CurrentUser;
  blocked: BlockedUser[];
  reports: Report[];
  blockable: BlockedUser[];
}) {
  const router = useRouter();
  const { push } = useToast();
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState(viewer.name);
  const [handle, setHandle] = useState(viewer.handle);
  const [bio, setBio] = useState(viewer.bio);
  const [interests, setInterests] = useState(viewer.interests);
  const [privacy, setPrivacy] = useState(viewer.privacy);
  const [theme, setTheme] = useState(viewer.theme === "light" ? "light" : "dark");
  const [accent, setAccent] = useState(viewer.accent);
  const [avatar, setAvatar] = useState({ emoji: viewer.avatarEmoji, gradient: viewer.gradient });
  const [blockedList, setBlockedList] = useState(blocked);
  const [reportTarget, setReportTarget] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [myReports, setMyReports] = useState(reports);

  const applyTheme = (next: string) => {
    setTheme(next);
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("muse-theme", next);
    startTransition(async () => {
      await saveAppearance({ theme: next, accent });
    });
  };

  const applyAccent = (next: string) => {
    setAccent(next);
    document.documentElement.dataset.accent = next;
    window.localStorage.setItem("muse-accent", next);
    startTransition(async () => {
      await saveAppearance({ theme, accent: next });
    });
  };

  const toggleInterest = (interest: string) => {
    setInterests((current) => (current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest]));
  };

  const submitProfile = (event: React.FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await saveProfile({ name, handle, bio, interests });
      if (!result.ok) push(result.error ?? "Could not save profile", "error");
      else {
        push("Profile saved");
        router.refresh();
      }
    });
  };

  const saveAvatarOnly = () => {
    startTransition(async () => {
      const result = await saveAvatar(avatar);
      if (!result.ok) push(result.error ?? "Could not save avatar", "error");
      else {
        push("Avatar updated");
        router.refresh();
      }
    });
  };

  const submitPrivacy = () => {
    startTransition(async () => {
      const result = await savePrivacy(privacy as unknown as Record<string, boolean>);
      if (!result.ok) push(result.error ?? "Could not save privacy", "error");
      else {
        push("Privacy preferences saved");
        router.refresh();
      }
    });
  };

  const unblock = (user: BlockedUser) => {
    setBlockedList((current) => current.filter((item) => item.id !== user.id));
    startTransition(async () => {
      const result = await toggleBlock(user.id);
      if (!result.ok) {
        setBlockedList((current) => [...current, user]);
        push(result.error ?? "Could not unblock", "error");
      } else {
        push(`Unblocked @${user.handle}`);
        router.refresh();
      }
    });
  };

  const blockUser = (userId: number) => {
    const target = blockable.find((item) => item.id === userId);
    if (!target) return;
    setBlockedList((current) => [...current, target]);
    startTransition(async () => {
      const result = await toggleBlock(target.id);
      if (!result.ok) {
        setBlockedList((current) => current.filter((item) => item.id !== target.id));
        push(result.error ?? "Could not block", "error");
      } else {
        push(`Blocked @${target.handle}`);
        router.refresh();
      }
    });
  };

  const submitReport = (event: React.FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await createReport({ target: reportTarget, reason: reportReason });
      if (!result.ok) push(result.error ?? "Could not send report", "error");
      else {
        push("Report sent to moderation");
        setMyReports((current) => [
          { id: Date.now(), target: reportTarget, reason: reportReason, status: "open", createdLabel: "just now" },
          ...current,
        ]);
        setReportTarget("");
        setReportReason("");
        router.refresh();
      }
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <div className="space-y-4">
        <form onSubmit={submitProfile} className="surface p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold">Profile</h2>
            <span className="muted text-[11px]">visible on your posts</span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <Avatar emoji={avatar.emoji} gradient={avatar.gradient} size={54} ring />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{name || "Your name"}</p>
              <p className="muted text-xs">@{handle}</p>
              <p className="muted mt-0.5 line-clamp-1 text-[11px]">{bio || "add a bio"}</p>
            </div>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <label className="block">
              <span className="muted mb-1 block text-[11px] font-semibold">Name</span>
              <input className="field text-sm" value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label className="block">
              <span className="muted mb-1 block text-[11px] font-semibold">Handle</span>
              <input className="field text-sm" value={handle} onChange={(event) => setHandle(event.target.value)} />
            </label>
          </div>
          <label className="mt-2 block">
            <span className="muted mb-1 block text-[11px] font-semibold">Bio</span>
            <textarea className="field text-sm" rows={2} maxLength={240} value={bio} onChange={(event) => setBio(event.target.value)} />
          </label>
          <div className="mt-2">
            <span className="muted mb-1 block text-[11px] font-semibold">Interests (tunes your feed and AI)</span>
            <div className="flex flex-wrap gap-1.5">
              {[...INTEREST_OPTIONS, ...interests.filter((interest) => !INTEREST_OPTIONS.includes(interest))].map((interest) => (
                <button key={interest} type="button" onClick={() => toggleInterest(interest)} className={`chip ${interests.includes(interest) ? "chip-active" : ""}`}>
                  {interest}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-sm mt-3" disabled={pending}>
            <CheckIcon size={13} /> {pending ? "Saving…" : "Save profile"}
          </button>
        </form>

        <div className="surface p-4">
          <h2 className="font-display flex items-center gap-1.5 text-base font-bold"><PaletteIcon size={15} /> Customization</h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="muted text-[11px] font-semibold">Theme</span>
            <button type="button" onClick={() => applyTheme("dark")} className={`chip ${theme === "dark" ? "chip-active" : ""}`}>
              <MoonIcon size={12} /> Dark
            </button>
            <button type="button" onClick={() => applyTheme("light")} className={`chip ${theme === "light" ? "chip-active" : ""}`}>
              <SunIcon size={12} /> Light
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="muted text-[11px] font-semibold">Accent</span>
            {ACCENTS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => applyAccent(option.key)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{
                  backgroundImage: `linear-gradient(135deg,${option.from},${option.to})`,
                  outline: accent === option.key ? "2px solid var(--accent)" : "1px solid var(--border)",
                  outlineOffset: 2,
                }}
                aria-label={option.label}
                title={option.label}
              >
                {accent === option.key ? <CheckIcon size={12} /> : ""}
              </button>
            ))}
          </div>
          <div className="mt-3">
            <span className="muted mb-1 block text-[11px] font-semibold">Avatar</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {EMOJI_OPTIONS.slice(0, 10).map((emoji) => (
                <button key={emoji} type="button" onClick={() => setAvatar({ ...avatar, emoji })} className={`chip ${avatar.emoji === emoji ? "chip-active" : ""}`} style={{ padding: "0.16rem 0.4rem" }}>
                  {emoji}
                </button>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {createPostGradientOptions.map((gradient) => (
                <button
                  key={gradient}
                  type="button"
                  aria-label="Avatar gradient"
                  onClick={() => setAvatar({ ...avatar, gradient })}
                  className="h-6 w-6 rounded-full"
                  style={{ backgroundImage: gradient, outline: avatar.gradient === gradient ? "2px solid var(--accent)" : "1px solid var(--border)", outlineOffset: 2 }}
                />
              ))}
              <button type="button" className="btn btn-secondary btn-sm ml-auto" onClick={saveAvatarOnly} disabled={pending}>
                Save avatar
              </button>
            </div>
          </div>
          <p className="muted mt-2 text-[11px]">Theme and accent apply instantly and sync to your account.</p>
        </div>

        <div className="surface p-4">
          <h2 className="font-display flex items-center gap-1.5 text-base font-bold"><ShieldIcon size={15} /> Privacy & safety</h2>
          <div className="mt-2 space-y-2">
            {PRIVACY_OPTIONS.map((option) => {
              const active = Boolean(privacy[option.key as keyof typeof privacy]);
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setPrivacy({ ...privacy, [option.key]: !active })}
                  className="surface-2 flex w-full items-center gap-3 p-3 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold">{option.label}</p>
                    <p className="muted text-[11px]">{option.body}</p>
                  </div>
                  <span
                    className="relative h-5 w-9 shrink-0 rounded-full transition"
                    style={{ background: active ? "var(--accent)" : "var(--panel-3)" }}
                  >
                    <span
                      className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all"
                      style={{ left: active ? 18 : 2 }}
                    />
                  </span>
                </button>
              );
            })}
          </div>
          <button type="button" className="btn btn-primary btn-sm mt-3" onClick={submitPrivacy} disabled={pending}>
            Save privacy settings
          </button>
        </div>

        <div className="surface p-4">
          <h2 className="font-display flex items-center gap-1.5 text-base font-bold"><ReportIcon size={15} /> Reporting & moderation</h2>
          <form onSubmit={submitReport} className="mt-2 space-y-2">
            <input className="field text-sm" placeholder="Who or what are you reporting? (handle, post, group)" value={reportTarget} onChange={(event) => setReportTarget(event.target.value)} />
            <textarea className="field text-sm" rows={2} placeholder="What happened?" value={reportReason} onChange={(event) => setReportReason(event.target.value)} />
            <button type="submit" className="btn btn-danger btn-sm" disabled={pending || !reportTarget.trim() || !reportReason.trim()}>
              Send report
            </button>
          </form>
          {myReports.length > 0 ? (
            <div className="mt-3 space-y-1.5">
              <p className="muted text-[11px] font-semibold">Your recent reports</p>
              {myReports.slice(0, 4).map((report) => (
                <div key={report.id} className="surface-2 flex items-center gap-2 p-2">
                  <span className="tag capitalize" style={{ color: report.status === "open" ? "#fbbf24" : undefined }}>{report.status}</span>
                  <p className="min-w-0 flex-1 truncate text-[11px]">{report.target} — {report.reason}</p>
                  <span className="muted text-[10px]">{report.createdLabel}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <aside className="space-y-4">
        <div className="surface p-4">
          <h2 className="font-display text-base font-bold">Account</h2>
          <div className="mt-2 space-y-1.5 text-xs">
            <div className="flex items-center justify-between"><span className="muted">Email</span><span className="truncate font-semibold">{viewer.email}</span></div>
            <div className="flex items-center justify-between"><span className="muted">Plan</span><Link href="/marketplace" className="font-semibold capitalize" style={{ color: "var(--accent)" }}>{viewer.plan}</Link></div>
            <div className="flex items-center justify-between"><span className="muted">XP</span><span className="font-semibold">{viewer.xp}</span></div>
            <div className="flex items-center justify-between"><span className="muted">Streak</span><span className="font-semibold">{viewer.streak} days</span></div>
          </div>
          <form action={logoutAction} className="mt-3">
            <button type="submit" className="btn btn-secondary btn-sm w-full">
              <LogOutIcon size={13} /> Log out
            </button>
          </form>
        </div>

        <div className="surface p-4">
          <h2 className="font-display flex items-center gap-1.5 text-base font-bold"><ShieldIcon size={15} /> Blocked accounts</h2>
          {blockedList.length === 0 ? (
            <p className="muted mt-2 text-xs">Nobody blocked. Your feed is unfiltered — use block if someone's spammy.</p>
          ) : (
            <div className="mt-2 space-y-1.5">
              {blockedList.map((user) => (
                <div key={user.id} className="flex items-center gap-2">
                  <Avatar emoji={user.emoji} gradient={user.gradient} size={26} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">{user.name}</p>
                    <p className="muted text-[10px]">@{user.handle}</p>
                  </div>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => unblock(user)} disabled={pending}>
                    Unblock
                  </button>
                </div>
              ))}
            </div>
          )}
          <label className="mt-3 block">
            <span className="muted mb-1 block text-[11px] font-semibold">Block someone</span>
            <select className="field text-xs" defaultValue="" onChange={(event) => { if (event.target.value) blockUser(Number(event.target.value)); event.target.value = ""; }}>
              <option value="">Choose a creator…</option>
              {blockable.filter((candidate) => !blockedList.some((user) => user.id === candidate.id)).map((candidate) => (
                <option key={candidate.id} value={candidate.id}>@{candidate.handle}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="surface p-4" style={{ backgroundImage: "linear-gradient(140deg, var(--accent-soft), transparent)" }}>
          <p className="flex items-center gap-1.5 text-sm font-bold"><SparklesIcon size={15} /> Secure by default</p>
          <p className="muted mt-1 text-xs">
            Sessions are httpOnly and expire after 30 days. Passwords are hashed with scrypt — we never store plain text.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="tag">httpOnly session</span>
            <span className="tag">scrypt hashing</span>
            <span className="tag">human moderation</span>
          </div>
        </div>

        <div className="surface p-4">
          <p className="flex items-center gap-1.5 text-sm font-bold"><TrashIcon size={14} /> Danger zone</p>
          <p className="muted mt-1 text-xs">Deleting your account removes projects, posts and XP permanently.</p>
          <button type="button" className="btn btn-danger btn-sm mt-2 w-full" onClick={() => push("Account deletion requires email confirmation — demo mode keeps your data", "info")}>
            Request account deletion
          </button>
        </div>
      </aside>
    </div>
  );
}
