import type {
  GeneratedCaption,
  GeneratedIdea,
  GeneratedThumbnail,
  ProjectDTO,
  TrendDTO,
} from "@/lib/types";

const GRADIENTS = [
  "linear-gradient(135deg,#8b5cf6,#ec4899)",
  "linear-gradient(135deg,#22d3ee,#8b5cf6)",
  "linear-gradient(135deg,#f97316,#ec4899)",
  "linear-gradient(135deg,#a3e635,#22d3ee)",
  "linear-gradient(135deg,#fbbf24,#8b5cf6)",
  "linear-gradient(135deg,#f43f5e,#8b5cf6)",
  "linear-gradient(135deg,#34d399,#3b82f6)",
];

const EMOJIS = ["🛸", "🌈", "🫧", "💿", "🔮", "🎧", "🪩", "🧿", "🌪️", "🦋", "🍒", "⚡"];

function pick<T>(list: T[], seed: number): T {
  return list[Math.abs(seed) % list.length];
}

function hash(input: string) {
  let value = 0;
  for (let i = 0; i < input.length; i += 1) {
    value = (value * 31 + input.charCodeAt(i)) | 0;
  }
  return value;
}

const TONES = ["chaotic", "soft-launch", "main character", "deadpan", "hype", "nostalgic", "feral"];

export function captionIdeas(topic: string, tone: string, hashtagSeeds: string[] = []): GeneratedCaption[] {
  const clean = topic.trim() || "my new drop";
  const seed = hash(`${clean}-${tone}`);
  const tags = Array.from(
    new Set([
      ...hashtagSeeds.map((t) => t.replace(/[^a-z0-9]/gi, "").toLowerCase()).filter(Boolean),
      "musestudio",
      "genzcreators",
      "newdrop",
      "creativeera",
    ]),
  ).slice(0, 4);

  const frames: Record<string, string[]> = {
    chaotic: [
      `${clean} but make it unhinged. no notes.`,
      `i made ${clean} at 3am and honestly? the sleep deprivation ATE.`,
      `pov: ${clean} found me before i found it.`,
    ],
    "soft-launch": [
      `something soft is coming. ${clean} is just the beginning.`,
      `not ready to explain ${clean} yet, just trust the process.`,
      `a little teaser of ${clean}. be gentle with her.`,
    ],
    "main character": [
      `the way ${clean} rewrote my entire personality.`,
      `${clean} walked so my main character era could run.`,
      `soundtrack for the montage of me becoming ${clean}.`,
    ],
    deadpan: [
      `${clean}. that's it. that's the post.`,
      `made ${clean}. it's fine. everything is fine.`,
      `i have ${clean} at home. the ${clean} at home:`,
    ],
    hype: [
      `${clean} IS FINALLY OUT. scream with me.`,
      `we've been waiting for ${clean}. it's here. go go go.`,
      `drop everything. ${clean} just dropped.`,
    ],
    nostalgic: [
      `a time capsule called ${clean}. smells like 2009 in here.`,
      `${clean} for everyone who still rips their mp3s.`,
      `if you remember limewire, ${clean} is for you.`,
    ],
    feral: [
      `${clean} bit me and i said thank you.`,
      `i'm feral for ${clean}. that's the whole update.`,
      `${clean} is the reason my screen time is embarrassing.`,
    ],
  };

  const options = frames[tone] ?? frames["main character"];
  return options.map((text) => ({ text, tone, hashtags: tags }));
}

export function thumbnailIdeas(topic: string, style: string): GeneratedThumbnail[] {
  const clean = topic.trim() || "new drop";
  const seed = hash(`${clean}-${style}`);
  const styles = [
    { label: "Chrome Y2K", prefix: "THE", suffix: "FILES" },
    { label: "Riso print", prefix: "soft", suffix: "static" },
    { label: "Neon arcade", prefix: "MIDNIGHT", suffix: "LOOP" },
    { label: "Vapor collage", prefix: "after", suffix: "hours" },
  ];

  return [0, 1, 2].map((index) => {
    const base = styles[(seed + index) % styles.length];
    return {
      title: `${base.prefix} ${clean.split(" ").slice(0, 2).join(" ")}`.toUpperCase(),
      subtitle: `${base.suffix} · ${style || base.label}`,
      emoji: pick(EMOJIS, seed + index * 7),
      gradient: pick(GRADIENTS, seed + index * 3),
      style: `${base.label} · 1280×720`,
    };
  });
}

export function avatarOptions(seed: number) {
  const emojis = ["🦋", "🛸", "🪩", "🧿", "🌪️", "🍄", "🫧", "🔮", "🐚", "⚡", "🍒", "🪐"];
  return emojis.map((emoji, index) => ({
    emoji,
    gradient: pick(GRADIENTS, seed + index * 5),
  }));
}

export function videoIdeas(topic: string): GeneratedIdea[] {
  const clean = topic.trim() || "my creative process";
  const seed = hash(clean);
  const sounds = [
    "sped-up bedroom pop · 148 BPM",
    "lo-fi boom bap with a film-grain filter",
    "hyperpop flip of a 2003 ringtone",
    "soft acoustic + vinyl crackle",
    "jungle break with pitched vocals",
  ];
  const formats = ["POV loop", "3-shot montage", "green-screen commentary", "get-ready-with-me edit"];

  return [0, 1, 2].map((index) => ({
    hook: [
      `"nobody asked but here's ${clean} in 12 seconds"`,
      `"rating ${clean} until it makes sense"`,
      `"i tried ${clean} so you don't have to"`,
    ][index],
    format: pick(formats, seed + index),
    beats: [
      `0-2s: hard cut to a close-up, no intro, text hook on screen`,
      `2-7s: 3 fast cuts showing the process (hands, screen, reaction)`,
      `7-12s: payoff moment + loop back to the first frame`,
    ],
    sound: pick(sounds, seed + index * 3),
    tags: [clean.split(" ")[0]?.toLowerCase() || "creative", "tutorialcore", "musestudio"].filter(Boolean),
  }));
}

export function lyricMatches(topic: string, tone: string): string[] {
  const clean = topic.trim() || "midnight";
  return [
    `I keep the ${clean} on repeat, repeat, repeat`,
    `Static in my hoodie, ${clean} in my teeth`,
    `You said forever, I heard ${clean} — same thing`,
    `Turn the ${tone} down, I can hear myself think`,
    `We were a rough take, never meant to be clean`,
  ];
}

export function mixAdvice(project: Pick<ProjectDTO, "title" | "bpm" | "tone" | "vocalStyle">) {
  return [
    `${project.title}: try lifting the vocal 1.5 dB and pulling the ${project.tone} pad back 2 dB — the ${project.vocalStyle} stacks are masking the hook.`,
    `Tempo note: ${project.bpm} BPM sits between a head-nod and a sprint. Nudge to ${project.bpm + 4} BPM and side-chain the bass to the kick.`,
    `Tone recipe: ${project.tone} → add a tape saturator at 15% + high-pass at 120 Hz for that warm-but-clean Gen Z mix.`,
  ];
}

export function recommendationCards(user: {
  name: string;
  interests: string[];
}, trends: TrendDTO[]) {
  const interests = user.interests.length ? user.interests : ["music", "editing", "fashion"];
  const trendingTitles = trends.slice(0, 3).map((t) => t.title);
  return [
    {
      emoji: "🎯",
      title: `Blend ${interests[0]} with ${trendingTitles[0] ?? "bedroom pop"}`,
      body: `Your ${interests[0]} projects over-index on ${trendingTitles[0] ?? "bedroom pop"}. Drop a 120 BPM sketch with a ${interests[1] ?? "visual"} twist — it fits your last 3 creations.`,
      action: "Start a project",
      href: "/music",
    },
    {
      emoji: "🫶",
      title: `Find your ${interests[1] ?? "design"} people`,
      body: `3 communities and ${new Set(interests).size + 2} creators match your interests right now. Small groups reply ~4x faster than big ones.`,
      action: "Browse community",
      href: "/community",
    },
    {
      emoji: "⚡",
      title: "One 10-minute challenge",
      body: `You're ${Math.max(60, 120 - interests.length * 12)} XP from the next level. A single daily challenge covers most of it — pick one and ship it.`,
      action: "Open quests",
      href: "/quests",
    },
  ];
}

export function assistantReply(
  prompt: string,
  user: { name: string; interests: string[]; xp: number; plan: string; streak: number },
  context: {
    projectCount: number;
    savedProject?: ProjectDTO | null;
    trends: TrendDTO[];
    challenges: { title: string; xp: number }[];
    groups: { name: string; slug: string }[];
  },
): string {
  const text = prompt.toLowerCase();
  const interests = user.interests.length ? user.interests : ["music", "editing"];
  const firstName = user.name.split(" ")[0];

  if (/what should i post|post today|content plan|plan my week|weekly plan|what next/.test(text)) {
    return `Here's your content plan for the next 3 days, ${firstName} — built around ${interests.slice(0, 2).join(" + ")}:\n\nDay 1 · Post the proof\n• 15-second first take of your current draft (${context.savedProject ? `"${context.savedProject.title}"` : "whatever is at 30%+"})\n• Caption: one line, no apology, no "sorry for the audio"\n\nDay 2 · Ride a trend\n• Remix ${context.trends[0]?.title ?? "the 7-second drop"} with one personal detail no one else has\n• Post in ${context.groups[0]?.name ?? "your main community"} first, feed second\n\nDay 3 · Community rep\n• Give 3 timestamped notes on other people's work (+15 XP)\n• Then finish the 10-minute challenge to keep your ${user.streak}-day streak.\n\nYou have ${context.projectCount} projects — shipping one beats starting another. Want captions for Day 1?`;
  }

  if (/caption|post idea|thread|hook/.test(text)) {
    const ideas = captionIdeas(prompt.replace(/caption|write|idea/gi, "").trim() || interests[0], "main character", interests);
    return `Here are 3 caption directions for ${interests[0]} content, tuned to your ${user.plan} profile:\n\n1. ${ideas[0].text}\n2. ${ideas[1].text}\n3. ${ideas[2].text}\n\nHashtags: ${ideas[0].hashtags.map((t) => `#${t}`).join(" ")}\n\nWant me to save one as a Creator Studio project? Tap "Creator Studio" and paste it in — or say "thumbnail" and I'll draft the cover too.`;
  }

  if (/beat|song|music|mix|vocal|lyric|track|bpm/.test(text)) {
    const project = context.savedProject;
    return `Music brain on. ${project ? `Pulling context from "${project.title}" (${project.bpm} BPM, ${project.tone} tone, ${project.vocalStyle} vocals).` : `You have ${context.projectCount} projects in the studio — let's add one more sketch.`}\n\n• Tempo lane: start 118-126 BPM if it's ${interests[0]}-adjacent, then pitch-shift the hook up 2 semitones for that earworm lift.\n• Vocal chain: high-pass 120 Hz → gentle compression → ${project?.vocalStyle ?? "airy"} doubler at 12 ms → a short plate reverb.\n• Lyric match: try the "repeat, repeat, repeat" cadence — it loops cleanly for 15s clips.\n\nTrending in your feed: ${context.trends.slice(0, 2).map((t) => t.title).join(" and ")}. Want a 4-bar starter lyric set?`;
  }

  if (/trend|discover|what.s hot|popular/.test(text)) {
    return `Trending with your people right now:\n\n${context.trends
      .slice(0, 5)
      .map((t) => `${t.emoji} ${t.title} — ${t.subtitle} (${t.delta >= 0 ? "+" : ""}${t.delta}%)`)
      .join("\n")}\n\nMy pick for you: ${context.trends[0]?.title ?? "bedroom pop revival"} because it overlaps with ${interests.join(" + ")}. Remix it from Discover and tag it "first-take" while it's still climbing.`;
  }

  if (/challenge|xp|streak|badge|level|quest/.test(text)) {
    return `You're on a ${user.streak}-day streak with ${user.xp} XP. ${user.streak < 3 ? "Three more days unlocks the Streak Keeper badge." : "Badge progress looks healthy — keep the streak alive."}\n\nDaily challenges open right now:\n${context.challenges
      .slice(0, 3)
      .map((c) => `• ${c.title} (+${c.xp} XP)`)
      .join("\n")}\n\nFastest path today: finish the 10-minute one, then post it in a community for the social XP bonus.`;
  }

  if (/community|friend|collab|group|people/.test(text)) {
    return `Good rooms for you: ${context.groups.slice(0, 3).map((g) => g.name).join(", ")}. They match ${interests.slice(0, 2).join(" and ")}.\n\nCollab playbook: post a 15-second "open verse" clip, pin a comment with your tempo + key, then reply to everyone in the first hour. That's the pattern behind most of the collabs on Muse this week.`;
  }

  if (/privacy|safe|block|report|moderation/.test(text)) {
    return `Safety quick answer: your account is ${user.plan === "free" ? "public by default" : "protected by private mode"}.\n\n• Block/report lives on every profile and post menu — reports reach moderation in under 10 minutes for verified creators.\n• Turn on "private account" in Settings → Safety to hide your work-in-progress projects from Discover.\n• AI personalization can be disabled separately from your public feed.`;
  }

  if (/price|plan|premium|pro|monetiz|sell/.test(text)) {
    return `You're on the ${user.plan} plan. Quick compare:\n\n• Free — 3 projects, basic generators, community access.\n• Muse Plus ($8/mo) — unlimited projects, stem separation, HD thumbnails, offline packs.\n• Muse Pro ($19/mo) — everything + marketplace storefront, analytics, priority AI.\n\nYou already have ${user.xp} XP, which unlocks 15% off your first month of Pro. Creators in the marketplace keep 85% of every sale.`;
  }

  if (/hi|hey|hello|what can you do|help/.test(text) && text.length < 32) {
    return `Hey ${firstName} 👋 I'm Muse — your studio assistant. I know your ${interests.slice(0, 2).join(" + ")} interests, your ${context.projectCount} projects, and what's trending.\n\nTry asking:\n• "write a caption for my new beat"\n• "what's trending in fashion edits"\n• "help me mix my vocals"\n• "what should I post today?"`;
  }

  return `Got it, ${firstName}. Here's how I'd approach "${prompt.trim().slice(0, 90)}":\n\n1. Anchor it in what you already do best — ${interests.slice(0, 2).join(" and ")}.\n2. Borrow one trending mechanic: ${context.trends[0]?.title ?? "speed-ramped montages"}.\n3. Keep the first 2 seconds loud and the caption to one line.\n\nYou have ${context.projectCount} projects in the studio. Want me to turn this into a draft project or generate captions/hashtags for it?`;
}

export function dailyBriefing(user: { name: string; interests: string[]; streak: number }, trends: TrendDTO[]) {
  const interest = user.interests[0] ?? "music";
  return `Morning, ${user.name.split(" ")[0]}. ${user.streak >= 3 ? `${user.streak}-day streak — do not break it today.` : "Let's start a streak today."} ${trends[0]?.title ?? "Bedroom pop"} is climbing in ${interest} and your saved ${interest} project is 60% done.`;
}
