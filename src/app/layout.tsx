import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Analytics } from '@vercel/analytics/next';
import { ensureSeeded } from "@/lib/seed";
import "./globals.css";

export const dynamic = "force-dynamic";

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#08070e" },
    { media: "(prefers-color-scheme: light)", color: "#f7f5fd" },
  ],
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "muse. — the AI creative studio for Gen Z",
  description:
    "Muse is the AI creative studio built for Gen Z: music editing, creator tools, a personalized feed, communities, quests and a creator marketplace.",
};

const themeScript = `(function(){try{var t=localStorage.getItem('muse-theme');var a=localStorage.getItem('muse-accent');document.documentElement.dataset.theme=(t==='light'||t==='dark')?t:'dark';if(a){document.documentElement.dataset.accent=a;}}catch(e){document.documentElement.dataset.theme='dark';}})();`;

export default async function RootLayout({ children }: { children: ReactNode }) {
  await ensureSeeded();

  return (
    <html lang="en" data-theme="dark" data-accent="violet" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Instrument+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
