export const createPostGradientOptions: string[] = [
  "linear-gradient(135deg,#8b5cf6,#ec4899)",
  "linear-gradient(135deg,#22d3ee,#6366f1)",
  "linear-gradient(135deg,#f97316,#ec4899)",
  "linear-gradient(135deg,#a3e635,#22d3ee)",
  "linear-gradient(135deg,#fbbf24,#8b5cf6)",
  "linear-gradient(135deg,#f43f5e,#8b5cf6)",
  "linear-gradient(135deg,#34d399,#3b82f6)",
];

export const EMOJI_OPTIONS = ["🎧", "💿", "🪩", "🛸", "🌅", "📱", "🧥", "🖼️", "🔮", "🫧", "🎙️", "⚡", "🧿", "🍄", "🌪️"];

export const TONES = [
  "midnight",
  "golden hour",
  "chrome",
  "riso",
  "neon arcade",
  "tape warm",
  "glass",
  "vapor",
];

export const VOCAL_STYLES = ["airy", "whispered", "chopped", "belted", "spoken", "stacked", "pitched up", "dry"];

export const INTEREST_OPTIONS = [
  "bedroom pop",
  "hyperpop",
  "lofi",
  "house",
  "video editing",
  "streetwear",
  "photography",
  "memes",
  "3d design",
  "album art",
  "motion",
  "dance",
  "anime",
  "gaming",
];

export const CAPTION_TONES = ["chaotic", "soft-launch", "main character", "deadpan", "hype", "nostalgic", "feral"];

export const PLAN_FEATURES: Record<string, { price: number; tagline: string; features: string[] }> = {
  free: {
    price: 0,
    tagline: "Everything you need to start posting.",
    features: ["3 active projects", "Basic AI generators", "Community + feed", "Daily challenges & XP"],
  },
  plus: {
    price: 800,
    tagline: "For creators shipping every week.",
    features: ["Unlimited projects", "Stem separation & vocal chains", "HD thumbnails and avatars", "Offline packs"],
  },
  pro: {
    price: 1900,
    tagline: "For creators turning this into income.",
    features: ["Everything in Plus", "Marketplace storefront", "Analytics on every drop", "Priority AI + 85% payouts"],
  },
};
