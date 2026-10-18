"use server";

import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { assistantMessages, groupMembers, groups, users } from "@/db/schema";
import { createSession, destroySession, hashPassword, verifyPassword, DEFAULT_PRIVACY } from "@/lib/auth";
import { ensureSeeded, DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/seed";

const GRADIENTS = [
  "linear-gradient(135deg,#8b5cf6,#ec4899)",
  "linear-gradient(135deg,#22d3ee,#8b5cf6)",
  "linear-gradient(135deg,#f97316,#ec4899)",
  "linear-gradient(135deg,#a3e635,#22d3ee)",
];

export type AuthResult = { error?: string };

export async function loginAction(input: { email: string; password: string }): Promise<AuthResult> {
  await ensureSeeded();
  const email = input.email.trim().toLowerCase();
  if (!email || !input.password) return { error: "Enter your email and password." };

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || !verifyPassword(input.password, user.passwordHash)) {
    return { error: "That email and password combo doesn't match." };
  }

  await db.update(users).set({ lastActiveOn: new Date().toISOString().slice(0, 10) }).where(eq(users.id, user.id));
  await createSession(user.id);
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function demoLoginAction(): Promise<AuthResult> {
  await ensureSeeded();
  const [user] = await db.select().from(users).where(eq(users.email, DEMO_EMAIL)).limit(1);
  if (!user) return { error: "Demo account is warming up — try again in a second." };
  await createSession(user.id);
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signupAction(input: {
  name: string;
  email: string;
  password: string;
  interests: string[];
}): Promise<AuthResult> {
  await ensureSeeded();
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (name.length < 2) return { error: "What should we call you?" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "That email doesn't look right." };
  if (password.length < 6) return { error: "Password needs at least 6 characters." };

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) return { error: "An account with that email already exists. Try logging in." };

  const base = name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 14) || "creator";
  let handle = base;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const [taken] = await db.select({ id: users.id }).from(users).where(eq(users.handle, handle)).limit(1);
    if (!taken) break;
    handle = `${base}${Math.floor(Math.random() * 9000 + 100)}`;
  }

  const [created] = await db
    .insert(users)
    .values({
      email,
      passwordHash: hashPassword(password),
      name,
      handle,
      bio: "new here · building something",
      avatarEmoji: "🪩",
      gradient: GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)],
      interests: input.interests.length ? input.interests : ["music", "video editing"],
      privacy: DEFAULT_PRIVACY as unknown as Record<string, boolean>,
      lastActiveOn: new Date().toISOString().slice(0, 10),
      xp: 10,
      streak: 1,
    })
    .returning({ id: users.id });

  await db.insert(assistantMessages).values({
    userId: created.id,
    role: "assistant",
    content: `Welcome to Muse, ${name.split(" ")[0]} 🌱\n\nYour studio is empty, which is the fun part. Start with:\n• a 4-bar idea in Music Studio (60 seconds)\n• a caption in Creator Studio (10 seconds)\n• one daily challenge for your first 60 XP\n\nI'll personalize everything as you create — just ask.`,
  });

  const [starterGroup] = await db.select({ id: groups.id }).from(groups).orderBy(groups.id).limit(1);
  if (starterGroup) {
    await db.insert(groupMembers).values({ groupId: starterGroup.id, userId: created.id }).onConflictDoNothing();
    await db.update(groups).set({ memberCount: sql`${groups.memberCount} + 1` }).where(eq(groups.id, starterGroup.id));
  }

  await createSession(created.id);
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function demoCredentials() {
  return { email: DEMO_EMAIL, password: DEMO_PASSWORD };
}
