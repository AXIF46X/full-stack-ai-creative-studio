import { sql } from "drizzle-orm";
import { db } from "@/db";
import {
  assistantMessages,
  badges,
  challenges,
  challengeCompletions,
  comments,
  groupMembers,
  groups,
  marketItems,
  posts,
  projects,
  purchases,
  reactions,
  trends,
  userBadges,
  users,
} from "@/db/schema";
import { hashPassword, DEFAULT_PRIVACY } from "@/lib/auth";

export const DEMO_EMAIL = "maya@muse.studio";
export const DEMO_PASSWORD = "demo1234";

const now = Date.now();
const ago = (minutes: number) => new Date(now - minutes * 60 * 1000);
const day = (days: number) => new Date(now - days * 24 * 60 * 60 * 1000);

const G = {
  violet: "linear-gradient(135deg,#8b5cf6,#ec4899)",
  cyan: "linear-gradient(135deg,#22d3ee,#8b5cf6)",
  sunset: "linear-gradient(135deg,#f97316,#ec4899)",
  lime: "linear-gradient(135deg,#a3e635,#22d3ee)",
  gold: "linear-gradient(135deg,#fbbf24,#8b5cf6)",
  rose: "linear-gradient(135deg,#f43f5e,#8b5cf6)",
  ocean: "linear-gradient(135deg,#34d399,#3b82f6)",
};

type SeedResult = { demoUserId: number | null };

let seedPromise: Promise<SeedResult> | null = null;

async function runSeed(): Promise<SeedResult> {
  const existing = await db.select({ id: users.id }).from(users).limit(1);
  if (existing.length > 0) {
    const demo = await db.select({ id: users.id }).from(users).where(sql`email = ${DEMO_EMAIL}`).limit(1);
    return { demoUserId: demo[0]?.id ?? existing[0].id };
  }

  const passwordHash = hashPassword(DEMO_PASSWORD);

  const people = [
    {
      email: DEMO_EMAIL,
      name: "Maya Okonkwo",
      handle: "mayaonmute",
      bio: "17 · bedroom pop producer + video editor. building in public, one demo at a time 🦋",
      avatarEmoji: "🦋",
      gradient: G.violet,
      plan: "pro",
      xp: 2480,
      streak: 12,
      isCreator: true,
      interests: ["bedroom pop", "video editing", "streetwear", "photography"],
    },
    {
      email: "jules@muse.studio",
      name: "Jules Park",
      handle: "jules.edit",
      bio: "senior in high school, junior in premiere. edit gods mod.",
      avatarEmoji: "🛸",
      gradient: G.cyan,
      plan: "plus",
      xp: 5120,
      streak: 34,
      isCreator: true,
      interests: ["video editing", "anime", "sound design"],
    },
    {
      email: "nova@muse.studio",
      name: "Nova Reyes",
      handle: "novareyes",
      bio: "dj + visuals. i ruin ringtones for a living 🪩",
      avatarEmoji: "🪩",
      gradient: G.sunset,
      plan: "pro",
      xp: 3870,
      streak: 21,
      isCreator: true,
      interests: ["hyperpop", "house", "visuals"],
    },
    {
      email: "kai@muse.studio",
      name: "Kai Mensah",
      handle: "kaimakes",
      bio: "fashion design student. 6 pieces, 24 fits. thrift or die.",
      avatarEmoji: "🌪️",
      gradient: G.lime,
      plan: "free",
      xp: 2110,
      streak: 8,
      isCreator: true,
      interests: ["streetwear", "photography", "design"],
    },
    {
      email: "rue@muse.studio",
      name: "Rue Alvarez",
      handle: "rueafterhours",
      bio: "photos at 2am, memes at 3am. the algorithm fears me.",
      avatarEmoji: "🧿",
      gradient: G.rose,
      plan: "plus",
      xp: 1640,
      streak: 5,
      isCreator: true,
      interests: ["memes", "photography", "film edits"],
    },
    {
      email: "theo@muse.studio",
      name: "Theo Lin",
      handle: "theoloops",
      bio: "lofi producer. free packs in my community. sleep is optional.",
      avatarEmoji: "🍄",
      gradient: G.gold,
      plan: "free",
      xp: 940,
      streak: 3,
      isCreator: true,
      interests: ["lofi", "guitar", "sound design"],
    },
    {
      email: "ari@muse.studio",
      name: "Ari Sokolov",
      handle: "arivisuals",
      bio: "3d + motion. renders that take longer than my hair routine.",
      avatarEmoji: "🫧",
      gradient: G.ocean,
      plan: "pro",
      xp: 4310,
      streak: 16,
      isCreator: true,
      interests: ["3d design", "motion", "album art"],
    },
    {
      email: "promoking@muse.studio",
      name: "Promo King",
      handle: "promoking",
      bio: "💯 FOLLOW FOR FOLLOW 💯 best promo rates",
      avatarEmoji: "💸",
      gradient: G.rose,
      plan: "free",
      xp: 30,
      streak: 1,
      isCreator: false,
      interests: ["marketing"],
    },
  ];

  const insertedUsers = await db
    .insert(users)
    .values(
      people.map((person, index) => ({
        email: person.email,
        passwordHash,
        name: person.name,
        handle: person.handle,
        bio: person.bio,
        avatarEmoji: person.avatarEmoji,
        gradient: person.gradient,
        plan: person.plan,
        xp: person.xp,
        streak: person.streak,
        isCreator: person.isCreator,
        interests: person.interests,
        theme: index === 0 ? "dark" : "dark",
        accent: index === 0 ? "violet" : "cyan",
        privacy: DEFAULT_PRIVACY as unknown as Record<string, boolean>,
        lastActiveOn: new Date().toISOString().slice(0, 10),
      })),
    )
    .returning({ id: users.id, handle: users.handle });

  const id = (handle: string) => insertedUsers.find((u) => u.handle === handle)!.id;
  const maya = id("mayaonmute");

  const insertedProjects = await db
    .insert(projects)
    .values([
      {
        userId: maya,
        title: "bathroom demos, vol. 2",
        kind: "music",
        status: "in_progress",
        description: "four-track EP recorded on a phone + a $20 mic. the reverb is literally my shower.",
        bpm: 124,
        tone: "midnight",
        vocalStyle: "airy",
        lyrics: "I keep the bathroom light on repeat, repeat, repeat\nStatic in my hoodie, midnight in my teeth",
        caption: "recorded this in a hotel bathroom at 3am. the acoustics ATE.",
        gradient: G.violet,
        emoji: "💿",
        progress: 72,
        savedOffline: true,
        updatedAt: ago(180),
      },
      {
        userId: maya,
        title: "sunburn (first take)",
        kind: "music",
        status: "draft",
        description: "acoustic sketch about august ending too fast. needs a bridge.",
        bpm: 98,
        tone: "golden hour",
        vocalStyle: "whispered",
        lyrics: "You said forever, I heard sunburn — same thing",
        caption: "",
        gradient: G.sunset,
        emoji: "🌅",
        progress: 34,
        savedOffline: true,
        updatedAt: day(1),
      },
      {
        userId: maya,
        title: "ringtone flip / hyper edit",
        kind: "music",
        status: "published",
        description: "2003 nokia ringtone into a hyperpop drop. 15s clip for shorts.",
        bpm: 152,
        tone: "chrome",
        vocalStyle: "chopped",
        lyrics: "",
        caption: "found a 1998 ringtone and ruined it (respectfully)",
        gradient: G.cyan,
        emoji: "📱",
        progress: 100,
        savedOffline: false,
        updatedAt: day(2),
      },
      {
        userId: maya,
        title: "style file · 6 fits",
        kind: "creator",
        status: "in_progress",
        description: "carousel + short video for the thrift drop. captions are half-written.",
        bpm: 120,
        tone: "riso",
        vocalStyle: "n/a",
        lyrics: "",
        caption: "6 pieces, 24 fits, zero new purchases. thrift math.",
        gradient: G.lime,
        emoji: "🧥",
        progress: 58,
        savedOffline: true,
        updatedAt: day(1),
      },
      {
        userId: maya,
        title: "thumbnail pack: after hours",
        kind: "creator",
        status: "draft",
        description: "three neon arcade covers for the video series.",
        bpm: 128,
        tone: "neon arcade",
        vocalStyle: "n/a",
        lyrics: "",
        caption: "new series, new covers. which one?",
        gradient: G.rose,
        emoji: "🖼️",
        progress: 20,
        savedOffline: false,
        updatedAt: day(3),
      },
    ])
    .returning({ id: projects.id });

  const postRows = await db
    .insert(posts)
    .values([
      {
        userId: maya,
        caption: "recorded this in a hotel bathroom at 3am because the reverb was too good to waste. vol. 2 is coming, be gentle with her 🫧",
        mediaUrl: "/media/neon-studio.jpg",
        mediaKind: "image",
        gradient: G.violet,
        emoji: "💿",
        tags: ["bedroompop", "firsttake", "demo"],
        likeCount: 842,
        commentCount: 3,
        createdAt: ago(95),
      },
      {
        userId: id("jules.edit"),
        caption: "premiere said no so i said ok and did it anyway. 7-second transition breakdown in the comments because i love you.",
        mediaUrl: "/media/edit-desk.jpg",
        mediaKind: "video",
        gradient: G.cyan,
        emoji: "✂️",
        tags: ["editgods", "tutorial", "transitions"],
        likeCount: 1290,
        commentCount: 2,
        createdAt: ago(240),
      },
      {
        userId: id("rueafterhours"),
        caption: "my brain when the beat drops at second 7 of a 15 second edit",
        mediaKind: "meme",
        gradient: G.rose,
        emoji: "🫠",
        tags: ["memelab", "edits", "relatable"],
        likeCount: 2410,
        commentCount: 2,
        createdAt: ago(310),
      },
      {
        userId: id("kaimakes"),
        caption: "6 pieces, 24 fits, zero new purchases. thrift math is undefeated. which fit is going in the drop cover?",
        mediaUrl: "/media/style-file.jpg",
        mediaKind: "image",
        gradient: G.lime,
        emoji: "🧥",
        tags: ["thrift", "streetwear", "stylefile"],
        likeCount: 631,
        commentCount: 1,
        createdAt: ago(480),
      },
      {
        userId: id("novareyes"),
        caption: "found a 1998 ringtone and ruined it (respectfully). hyperpop flip, 152 BPM, no apologies 💅",
        mediaKind: "audio",
        gradient: G.sunset,
        emoji: "🪩",
        tags: ["hyperpop", "ringtoneflip", "newdrop"],
        likeCount: 977,
        commentCount: 1,
        createdAt: ago(620),
      },
      {
        userId: id("theoloops"),
        caption: "pack vol. 3 is free in Bedroom Pop Basement. 24 loops, all 82 BPM, all slightly sad. tag me if you use one 🌧️",
        mediaKind: "audio",
        gradient: G.gold,
        emoji: "🍄",
        tags: ["lofi", "freepack", "community"],
        likeCount: 412,
        commentCount: 1,
        createdAt: ago(780),
      },
      {
        userId: id("arivisuals"),
        caption: "rendered for 14 hours. looped at 2 seconds. worth it? (yes) cover art commissions open this weekend 🫧",
        mediaUrl: "/media/dreamscape.jpg",
        mediaKind: "art",
        gradient: G.ocean,
        emoji: "🔮",
        tags: ["3d", "coverart", "motion"],
        likeCount: 1520,
        commentCount: 1,
        createdAt: ago(1100),
      },
      {
        userId: maya,
        caption: "first-take vocals only. no autotune (ok a little). tell me if the bridge is too much and i'll ignore you affectionately.",
        mediaKind: "audio",
        gradient: G.ocean,
        emoji: "🎙️",
        tags: ["vocals", "firsttake", "feedback"],
        likeCount: 388,
        commentCount: 2,
        createdAt: ago(1500),
      },
      {
        userId: id("jules.edit"),
        caption: "cover art clinic: drop your thumbnail, i'll tell you the one thing that would double your click-through. i'm nice about it.",
        mediaKind: "art",
        gradient: G.violet,
        emoji: "🖼️",
        tags: ["coverart", "feedback", "thumbnails"],
        likeCount: 705,
        commentCount: 2,
        createdAt: ago(1900),
      },
    ])
    .returning({ id: posts.id });

  const p = postRows.map((row) => row.id);

  await db.insert(comments).values([
    { postId: p[0], userId: id("jules.edit"), body: "the shower reverb is a producer, not a location. screaming.", createdAt: ago(80) },
    { postId: p[0], userId: id("novareyes"), body: "send me the stems and i'll do a visualizer for the release", createdAt: ago(60) },
    { postId: p[0], userId: id("rueafterhours"), body: "vol 1 is still in my rotation. take your time queen.", createdAt: ago(30) },
    { postId: p[1], userId: id("arivisuals"), body: "the speed ramp at 0:04 is illegal. tutorial now.", createdAt: ago(210) },
    { postId: p[1], userId: id("kaimakes"), body: "saving this for the drop video, thank you for your service", createdAt: ago(90) },
    { postId: p[2], userId: id("mayaonmute"), body: "this is my entire personality for the next two weeks", createdAt: ago(250) },
    { postId: p[2], userId: id("theoloops"), body: "the 7 second drop is a universal experience", createdAt: ago(200) },
    { postId: p[3], userId: id("jules.edit"), body: "fit 3 with the cargos. that's the cover.", createdAt: ago(400) },
    { postId: p[4], userId: id("mayaonmute"), body: "ruined it? you invented a genre.", createdAt: ago(500) },
    { postId: p[5], userId: id("mayaonmute"), body: "already dragged loop 14 into my EP, thank you ily", createdAt: ago(700) },
    { postId: p[6], userId: id("novareyes"), body: "14 hours for 2 seconds is the most artist thing ever", createdAt: ago(1000) },
    { postId: p[7], userId: id("jules.edit"), body: "bridge is perfect, keep it raw", createdAt: ago(1400) },
    { postId: p[7], userId: id("arivisuals"), body: "the breath at 0:12 should stay. don't touch it.", createdAt: ago(1300) },
    { postId: p[8], userId: id("kaimakes"), body: "joining just to get roasted productively", createdAt: ago(1800) },
    { postId: p[8], userId: id("theoloops"), body: "my text contrast is bad and i've known it for a year", createdAt: ago(1700) },
  ]);

  await db.insert(reactions).values([
    { postId: p[0], userId: maya, emoji: "🔥" },
    { postId: p[1], userId: maya, emoji: "✨" },
    { postId: p[2], userId: maya, emoji: "😭" },
    { postId: p[4], userId: maya, emoji: "🔥" },
    { postId: p[6], userId: maya, emoji: "💜" },
  ]);

  const insertedGroups = await db
    .insert(groups)
    .values([
      {
        name: "Bedroom Pop Basement",
        slug: "bedroom-pop-basement",
        description: "Phone-mic demos, shower reverb, and collabs at 2am. Share your first takes, get real feedback.",
        emoji: "🛏️",
        gradient: G.violet,
        memberCount: 12480,
        tags: ["bedroom pop", "production", "collab"],
      },
      {
        name: "Edit Gods",
        slug: "edit-gods",
        description: "Transitions, sound design, and the 7-second rule. Weekly edit battles with XP prizes.",
        emoji: "✂️",
        gradient: G.cyan,
        memberCount: 9310,
        tags: ["video editing", "tutorials", "contests"],
      },
      {
        name: "Thrift & Fit Check",
        slug: "thrift-and-fit-check",
        description: "Fit checks, thrift hauls, and style files. No gatekeeping, no fast fashion.",
        emoji: "🧥",
        gradient: G.lime,
        memberCount: 7420,
        tags: ["streetwear", "thrifting", "style"],
      },
      {
        name: "Meme Lab",
        slug: "meme-lab",
        description: "Deploy memes responsibly. Reaction image swaps, edits, and the memes that actually hit.",
        emoji: "🫠",
        gradient: G.rose,
        memberCount: 18750,
        tags: ["memes", "humor", "edits"],
      },
      {
        name: "Cover Art Clinic",
        slug: "cover-art-clinic",
        description: "Post a cover, get one actionable note. Thumbnails, album art, and typography crimes.",
        emoji: "🖼️",
        gradient: G.ocean,
        memberCount: 5210,
        tags: ["design", "cover art", "feedback"],
      },
    ])
    .returning({ id: groups.id });

  await db.insert(groupMembers).values([
    { groupId: insertedGroups[0].id, userId: maya },
    { groupId: insertedGroups[3].id, userId: maya },
    { groupId: insertedGroups[1].id, userId: id("jules.edit") },
  ]);

  const insertedChallenges = await db
    .insert(challenges)
    .values([
      { title: "Post one first-take clip", description: "No edits, no autotune. 15 seconds of raw you. Tag it #firsttake.", xp: 60, emoji: "🎙️", category: "creative", completions: 1842 },
      { title: "Remix a trending sound", description: "Grab something from Discover and flip it in the Music Studio.", xp: 80, emoji: "🎛️", category: "music", completions: 963 },
      { title: "Give 3 creators real feedback", description: "Comments that mention a timestamp get double XP.", xp: 40, emoji: "🫶", category: "social", completions: 3021 },
      { title: "Design a cover in 10 minutes", description: "Use the Creator Studio thumbnail lab. Constraints make bangers.", xp: 50, emoji: "🖼️", category: "design", completions: 1276 },
      { title: "Drop a lyric in Meme Lab", description: "One line. Make it a screenshot people repost.", xp: 35, emoji: "💬", category: "social", completions: 2244 },
      { title: "Finish a draft project", description: "Any project at 30%+. You know the one.", xp: 100, emoji: "🏁", category: "creative", completions: 688 },
    ])
    .returning({ id: challenges.id });

  await db.insert(challengeCompletions).values({ challengeId: insertedChallenges[2].id, userId: maya, createdAt: ago(300) });

  const insertedBadges = await db
    .insert(badges)
    .values([
      { name: "First Upload", emoji: "🌱", description: "Posted your first creation to the community.", xpRequired: 0 },
      { name: "Streak Keeper", emoji: "🔥", description: "Kept a 7-day creative streak alive.", xpRequired: 150 },
      { name: "Remix Royalty", emoji: "🎛️", description: "Flipped 10 trending sounds into originals.", xpRequired: 500 },
      { name: "Community Pillar", emoji: "🫶", description: "Left 50 pieces of genuinely useful feedback.", xpRequired: 800 },
      { name: "Cover Star", emoji: "🖼️", description: "A creation hit 1k likes on Discover.", xpRequired: 1200 },
      { name: "Studio Legend", emoji: "👑", description: "Reached 3,000 XP and mentored new creators.", xpRequired: 3000 },
    ])
    .returning({ id: badges.id, xpRequired: badges.xpRequired });

  await db.insert(userBadges).values(
    insertedBadges
      .filter((badge) => badge.xpRequired <= 2480)
      .map((badge) => ({ userId: maya, badgeId: badge.id })),
  );

  await db.insert(trends).values([
    { title: "Bedroom pop revival", subtitle: "Phone mics, shower reverb, 120 BPM", kind: "music", score: 98, delta: 34, emoji: "🛏️", gradient: G.violet, tags: ["bedroom pop", "diy"] },
    { title: "Ringtone flips", subtitle: "2003 Nokia → hyperpop drop", kind: "music", score: 94, delta: 61, emoji: "📱", gradient: G.sunset, tags: ["hyperpop", "flips"] },
    { title: "Speed-ramped fit checks", subtitle: "3 cuts, one fit, 9 seconds", kind: "style", score: 91, delta: 27, emoji: "🧥", gradient: G.lime, tags: ["streetwear", "edits"] },
    { title: "Riso-print cover art", subtitle: "Muted palettes, visible grain", kind: "style", score: 88, delta: 19, emoji: "🖼️", gradient: G.gold, tags: ["design", "cover art"] },
    { title: "The 7-second drop meme", subtitle: "Beat drops + immediate chaos", kind: "meme", score: 96, delta: 44, emoji: "🫠", gradient: G.rose, tags: ["memes", "edits"] },
    { title: "Soft-launch photo dumps", subtitle: "Blurry, flash-on, unbothered", kind: "meme", score: 84, delta: 12, emoji: "📸", gradient: G.cyan, tags: ["photography", "aesthetic"] },
    { title: "Lofi loop packs", subtitle: "Free 82 BPM loops for everyone", kind: "music", score: 82, delta: 9, emoji: "🌧️", gradient: G.ocean, tags: ["lofi", "free packs"] },
    { title: "Chrome Y2K typography", subtitle: "Liquid metal, huge type", kind: "style", score: 79, delta: 21, emoji: "🪩", gradient: G.cyan, tags: ["design", "y2k"] },
    { title: "@jules.edit", subtitle: "Transitions that shouldn't be legal", kind: "creator", score: 93, delta: 18, emoji: "✂️", gradient: G.cyan, tags: ["video editing"] },
    { title: "@novareyes", subtitle: "Ruining ringtones, respectfully", kind: "creator", score: 90, delta: 25, emoji: "🪩", gradient: G.sunset, tags: ["hyperpop"] },
    { title: "@kaimakes", subtitle: "Thrift math and 24 fits", kind: "creator", score: 87, delta: 31, emoji: "🌪️", gradient: G.lime, tags: ["streetwear"] },
    { title: "@arivisuals", subtitle: "3D covers worth the render time", kind: "creator", score: 85, delta: 14, emoji: "🔮", gradient: G.ocean, tags: ["3d", "cover art"] },
  ]);

  const insertedItems = await db
    .insert(marketItems)
    .values([
      { title: "Shower Reverb Vocal Chain", creator: "@mayaonmute", category: "preset", price: 1200, emoji: "🫧", gradient: G.violet, rating: "4.9", sales: 412 },
      { title: "Edit Gods Transition Pack", creator: "@jules.edit", category: "template", price: 2400, emoji: "✂️", gradient: G.cyan, rating: "5.0", sales: 1890 },
      { title: "Hyper Ringtone Sample Kit", creator: "@novareyes", category: "sample pack", price: 1800, emoji: "📱", gradient: G.sunset, rating: "4.8", sales: 963 },
      { title: "Thrift Fit Carousel Kit", creator: "@kaimakes", category: "template", price: 900, emoji: "🧥", gradient: G.lime, rating: "4.7", sales: 604 },
      { title: "Meme Reaction Sticker Set", creator: "@rueafterhours", category: "assets", price: 600, emoji: "🫠", gradient: G.rose, rating: "4.9", sales: 2210 },
      { title: "Sleepy Lofi Loop Bundle", creator: "@theoloops", category: "sample pack", price: 1500, emoji: "🌧️", gradient: G.gold, rating: "4.8", sales: 744 },
      { title: "3D Cover Art Presets", creator: "@arivisuals", category: "preset", price: 3200, emoji: "🔮", gradient: G.ocean, rating: "5.0", sales: 318 },
      { title: "1:1 Creator Session (45 min)", creator: "@jules.edit", category: "session", price: 6500, emoji: "☎️", gradient: G.violet, rating: "5.0", sales: 87 },
    ])
    .returning({ id: marketItems.id });

  await db.insert(purchases).values({ userId: maya, itemId: insertedItems[4].id, createdAt: ago(2600) });

  await db.insert(assistantMessages).values([
    {
      userId: maya,
      role: "assistant",
      content:
        "Hey Maya 👋 I'm Muse, your studio assistant. I've read your 5 projects, your feed, and today's trends.\n\nYou're 12 days into a streak and 72% through \"bathroom demos, vol. 2\" — finishing it today is worth 100 XP.\n\nTry asking me:\n• \"write a caption for my new beat\"\n• \"how do I mix airy vocals?\"\n• \"what's trending in streetwear?\"",
      createdAt: day(1),
    },
  ]);

  return { demoUserId: maya };
}

export async function ensureSeeded(): Promise<SeedResult> {
  if (!seedPromise) {
    seedPromise = runSeed().catch((error) => {
      seedPromise = null;
      console.error("[seed] failed", error);
      return { demoUserId: null };
    });
  }
  return seedPromise;
}
