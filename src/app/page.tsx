import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  ArrowRightIcon,
  CheckIcon,
  CompassIcon,
  FlameIcon,
  MusicIcon,
  ShieldIcon,
  SparklesIcon,
  UsersIcon,
  WandIcon,
  ZapIcon,
} from "@/components/icons";

const FEATURES = [
  {
    emoji: "🤖",
    title: "AI studio assistant",
    body: "Personalized recommendations, creative ideas and instant help that actually knows your projects.",
  },
  {
    emoji: "🌊",
    title: "Personalized feed",
    body: "Content tuned to your interests, hobbies and preferences — not just what's loudest.",
  },
  {
    emoji: "🎚️",
    title: "Music studio",
    body: "Edit songs, adjust vocals, match lyrics to your beat and change the tone in one place.",
  },
  {
    emoji: "🪄",
    title: "Creator studio",
    body: "Generate captions, thumbnails, avatars and short-video ideas in seconds.",
  },
  {
    emoji: "🫂",
    title: "Social community",
    body: "Share creations, comment, react and join interest groups that get your niche.",
  },
  {
    emoji: "🏆",
    title: "Gamification",
    body: "XP, badges, daily challenges and streaks that make shipping a habit.",
  },
  {
    emoji: "🧭",
    title: "Trending discover",
    body: "Explore popular music, memes, styles and creator content while it's still climbing.",
  },
  {
    emoji: "🎨",
    title: "Deep customization",
    body: "Themes, accent colors, profile designs, avatars and a properly good dark mode.",
  },
  {
    emoji: "🔎",
    title: "Smart search",
    body: "Find content, creators, tools and communities in one keystroke.",
  },
  {
    emoji: "🛡️",
    title: "Privacy & safety",
    body: "Secure login, block and report tools, privacy controls and real moderation.",
  },
  {
    emoji: "📥",
    title: "Offline mode",
    body: "Save projects and tools so you can keep creating on the bus with no signal.",
  },
  {
    emoji: "💸",
    title: "Monetization",
    body: "Freemium plans, premium features and a creator marketplace where you keep the bag.",
  },
];

const STEPS = [
  { icon: SparklesIcon, title: "Ask Muse", body: "Describe the vibe. Get ideas, captions, lyric matches and a plan for the week." },
  { icon: MusicIcon, title: "Make it", body: "Build the track and the cover in the studio. Vocals, tone, tempo, thumbnails." },
  { icon: UsersIcon, title: "Ship it", body: "Post to your feed, drop it in a community, collect XP and reactions." },
];

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="overflow-x-hidden">
      <header className="sticky top-0 z-40 border-b" style={{ borderColor: "var(--border)", background: "color-mix(in srgb, var(--bg) 82%, transparent)", backdropFilter: "blur(16px)" }}>
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl text-lg font-black text-white" style={{ backgroundImage: "linear-gradient(135deg,var(--accent),var(--accent-2))" }}>
              m
            </span>
            <span className="font-display text-lg font-bold">
              muse<span style={{ color: "var(--accent)" }}>.</span>
            </span>
          </Link>
          <nav className="muted ml-4 hidden items-center gap-5 text-sm font-medium md:flex">
            <a href="#features" className="hover:opacity-80">Features</a>
            <a href="#studio" className="hover:opacity-80">Studio</a>
            <a href="#community" className="hover:opacity-80">Community</a>
            <a href="#plans" className="hover:opacity-80">Plans</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/login" className="btn btn-ghost">Log in</Link>
            <Link href="/signup" className="btn btn-primary">
              Start free <ArrowRightIcon size={15} />
            </Link>
          </div>
        </div>
      </header>

      <section className="relative mx-auto w-full max-w-6xl px-4 pt-12 pb-16 sm:px-6 sm:pt-20">
        <div
          className="pointer-events-none absolute -top-24 right-0 h-[420px] w-[420px] rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle,var(--accent),transparent 70%)" }}
        />
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="animate-rise">
            <span className="chip" style={{ color: "var(--accent)", borderColor: "color-mix(in srgb, var(--accent) 40%, transparent)" }}>
              <SparklesIcon size={14} /> AI creative studio · built for Gen Z
            </span>
            <h1 className="font-display mt-4 text-4xl leading-[1.02] font-bold sm:text-6xl">
              Make the thing.
              <br />
              Then make it <span className="gradient-text">louder.</span>
            </h1>
            <p className="muted mt-4 max-w-xl text-base sm:text-lg">
              Music editing, AI captions, thumbnails, avatars and a feed that gets your niche. Muse is the
              studio, the community and the group chat — in one beautiful place.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href="/signup" className="btn btn-primary px-5 py-3 text-sm">
                Create your studio <ArrowRightIcon size={16} />
              </Link>
              <Link href="/login" className="btn btn-secondary px-5 py-3 text-sm">
                <ZapIcon size={15} /> Try the demo account
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs" style={{ color: "var(--muted)" }}>
              <span className="flex items-center gap-1.5"><CheckIcon size={13} style={{ color: "var(--accent)" }} /> Free forever plan</span>
              <span className="flex items-center gap-1.5"><CheckIcon size={13} style={{ color: "var(--accent)" }} /> No credit card</span>
              <span className="flex items-center gap-1.5"><FlameIcon size={13} style={{ color: "#fb923c" }} /> 12-day streak energy</span>
            </div>
          </div>

          <div className="relative">
            <div className="animate-floaty relative overflow-hidden rounded-[32px] border" style={{ borderColor: "var(--border)", boxShadow: "var(--shadow)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/media/hero.jpg" alt="Muse creative studio preview" className="h-[330px] w-full object-cover sm:h-[420px]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent" />
              <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
                <div className="glass rounded-2xl px-3 py-2">
                  <p className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: "var(--muted)" }}>Now in studio</p>
                  <p className="text-sm font-bold text-white">bathroom demos, vol. 2</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="progress w-24" style={{ background: "rgba(255,255,255,0.2)" }}>
                      <span style={{ width: "72%" }} />
                    </div>
                    <span className="text-[10px] font-semibold text-white">72%</span>
                  </div>
                </div>
                <span className="chip" style={{ background: "rgba(0,0,0,0.45)", color: "#fff", borderColor: "rgba(255,255,255,0.25)" }}>
                  <SparklesIcon size={12} /> AI mix ready
                </span>
              </div>
            </div>
            <div className="surface absolute -left-3 top-6 hidden w-44 p-3 sm:block">
              <p className="text-[10px] font-bold tracking-wider uppercase" style={{ color: "var(--muted)" }}>AI pick</p>
              <p className="mt-1 text-xs font-semibold">Ringtone flips are up 61%</p>
              <p className="muted mt-1 text-[10px]">Perfect for your hyperpop era</p>
            </div>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { value: "72k", label: "creators making noise" },
            { value: "310k", label: "creations shipped" },
            { value: "12", label: "tools in one studio" },
            { value: "85%", label: "marketplace payout" },
          ].map((stat) => (
            <div key={stat.label} className="surface px-4 py-3">
              <p className="font-display text-2xl font-bold">{stat.value}</p>
              <p className="muted text-[11px]">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="border-y py-3" style={{ borderColor: "var(--border)", background: "var(--panel)" }}>
        <div className="flex w-max animate-marquee gap-8 px-4">
          {[...Array(2)].map((_, loop) => (
            <div key={loop} className="flex shrink-0 items-center gap-8">
              {["bedroom pop", "hyperpop", "thrift fits", "7-second edits", "riso covers", "lofi loops", "meme lab", "chrome y2k", "first takes", "voice memos"].map((item) => (
                <span key={`${loop}-${item}`} className="font-display text-sm font-semibold tracking-wide" style={{ color: "var(--muted)" }}>
                  {item} <span style={{ color: "var(--accent)" }}>✳</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <section id="features" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-bold tracking-[0.18em] uppercase" style={{ color: "var(--accent)" }}>Everything, one studio</p>
          <h2 className="font-display mt-2 text-3xl font-bold sm:text-4xl">Built for people who make things at 2am</h2>
          <p className="muted mt-3 text-sm sm:text-base">
            No five-app workflow. No gatekeeping. Muse brings the tools, the audience and the momentum together.
          </p>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="surface hover-lift p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl text-lg" style={{ background: "var(--panel-2)" }}>
                {feature.emoji}
              </span>
              <h3 className="font-display mt-3 text-base font-bold">{feature.title}</h3>
              <p className="muted mt-1 text-sm leading-relaxed">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="studio" className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
        <div className="surface overflow-hidden p-5 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-3">
            {STEPS.map((step, index) => (
              <div key={step.title} className="surface-2 p-4">
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                    <step.icon size={17} />
                  </span>
                  <span className="font-display text-2xl font-bold opacity-20">0{index + 1}</span>
                </div>
                <h3 className="font-display mt-3 text-base font-bold">{step.title}</h3>
                <p className="muted mt-1 text-sm">{step.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div id="community" className="surface-2 p-4">
              <div className="flex items-center gap-2">
                <UsersIcon size={16} style={{ color: "var(--accent)" }} />
                <p className="text-sm font-bold">Community that replies</p>
              </div>
              <p className="muted mt-2 text-sm">
                &ldquo;I posted a first take in Bedroom Pop Basement and got 14 notes in an hour — one of them
                turned into a collab that's on my EP.&rdquo;
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full text-xs" style={{ backgroundImage: "linear-gradient(135deg,#8b5cf6,#ec4899)" }}>🦋</span>
                <span className="text-xs font-semibold">Maya, 17 · bedroom pop</span>
              </div>
            </div>
            <div className="surface-2 p-4">
              <div className="flex items-center gap-2">
                <ShieldIcon size={16} style={{ color: "var(--accent)" }} />
                <p className="text-sm font-bold">Safe by design</p>
              </div>
              <p className="muted mt-2 text-sm">
                Secure sessions, per-post audience controls, blocking, reporting and a moderation queue with
                humans behind it. Your drafts stay yours.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {["private account", "block & report", "AI opt-out", "offline packs"].map((tag) => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="plans" className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] uppercase" style={{ color: "var(--accent)" }}>Monetization</p>
            <h2 className="font-display mt-1 text-3xl font-bold">Start free. Grow into your era.</h2>
          </div>
          <Link href="/marketplace" className="btn btn-secondary btn-sm">
            <CompassIcon size={14} /> Peek the marketplace
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { name: "Free", price: "$0", perks: ["3 projects", "Basic AI tools", "Community access", "Daily challenges"] },
            { name: "Plus", price: "$8", perks: ["Unlimited projects", "Stem separation", "HD thumbnails", "Offline packs"], featured: true },
            { name: "Pro", price: "$19", perks: ["Marketplace storefront", "Analytics", "Priority AI", "85% payouts"] },
          ].map((plan) => (
            <div
              key={plan.name}
              className="surface p-5"
              style={plan.featured ? { borderColor: "var(--accent)", boxShadow: "0 0 0 1px var(--accent)" } : undefined}
            >
              <div className="flex items-center justify-between">
                <p className="font-display text-lg font-bold">Muse {plan.name}</p>
                {plan.featured ? <span className="chip chip-active">most popular</span> : null}
              </div>
              <p className="font-display mt-2 text-3xl font-bold">
                {plan.price}
                <span className="muted text-sm font-medium">/mo</span>
              </p>
              <ul className="mt-3 space-y-1.5">
                {plan.perks.map((perk) => (
                  <li key={perk} className="muted flex items-center gap-1.5 text-sm">
                    <CheckIcon size={13} style={{ color: "var(--accent)" }} /> {perk}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className={`btn mt-4 w-full ${plan.featured ? "btn-primary" : "btn-secondary"}`}>
                {plan.name === "Free" ? "Start free" : "Choose plan"}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
        <div
          className="relative overflow-hidden rounded-[32px] px-6 py-12 text-center"
          style={{ backgroundImage: "linear-gradient(130deg,var(--accent),var(--accent-2))" }}
        >
          <div className="noise absolute inset-0" />
          <div className="relative">
            <WandIcon size={28} className="mx-auto text-white" />
            <h2 className="font-display mx-auto mt-3 max-w-lg text-3xl font-bold text-white sm:text-4xl">
              Your next era starts with one upload.
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-white/85">
              Join the studio, meet Muse, and post something imperfect today.
            </p>
            <Link href="/signup" className="btn mt-5 bg-white px-5 py-3 text-sm font-bold text-black hover:opacity-90">
              Get started — it's free
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t py-8" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 text-xs sm:flex-row sm:px-6" style={{ color: "var(--muted)" }}>
          <p><span className="font-display font-bold">muse.</span> © {new Date().getFullYear()} — made for the group chat generation.</p>
          <div className="flex items-center gap-4">
            <Link href="/login">Log in</Link>
            <Link href="/signup">Sign up</Link>
            <span>Privacy</span>
            <span>Safety</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
