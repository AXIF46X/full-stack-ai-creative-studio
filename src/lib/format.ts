export function timeAgo(input: Date | string) {
  const date = typeof input === "string" ? new Date(input) : input;
  const seconds = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function compactNumber(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return `${value}`;
}

export const XP_PER_LEVEL = 500;

export function levelInfo(xp: number) {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const intoLevel = xp % XP_PER_LEVEL;
  const nextLevelXp = level * XP_PER_LEVEL;
  const percent = Math.min(100, Math.round((intoLevel / XP_PER_LEVEL) * 100));
  return { level, intoLevel, nextLevelXp, percent, toNext: XP_PER_LEVEL - intoLevel };
}

export function priceLabel(cents: number) {
  if (cents === 0) return "Free";
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export const ACCENTS: Record<string, { label: string; from: string; to: string }> = {
  violet: { label: "Violet hour", from: "#8b5cf6", to: "#ec4899" },
  cyan: { label: "Chrome", from: "#22d3ee", to: "#6366f1" },
  lime: { label: "Acid", from: "#a3e635", to: "#22d3ee" },
  sunset: { label: "Sunset", from: "#f97316", to: "#ec4899" },
  gold: { label: "Gold rush", from: "#fbbf24", to: "#8b5cf6" },
};
