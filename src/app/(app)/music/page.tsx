import Link from "next/link";
import { MusicStudio } from "@/components/music-studio";
import { PageHeader } from "@/components/page-header";
import { SparklesIcon } from "@/components/icons";
import { requireUser } from "@/lib/auth";
import { getProjects } from "@/lib/data";

export const metadata = { title: "Music Studio · muse." };

export default async function MusicPage() {
  const user = await requireUser();
  const projects = await getProjects(user.id, "music");

  return (
    <div>
      <PageHeader
        eyebrow="Music studio"
        title="Edit songs without leaving the browser"
        description="Tempo, tone, vocal style and lyrics in one session — plus an AI that reads your mix."
        actions={
          <Link href="/assistant" className="btn btn-secondary btn-sm">
            <SparklesIcon size={14} /> Ask Muse for a hook
          </Link>
        }
      />
      <MusicStudio viewer={user} projects={projects} />
    </div>
  );
}
