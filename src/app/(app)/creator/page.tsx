import Link from "next/link";
import { CreatorStudio } from "@/components/creator-studio";
import { PageHeader } from "@/components/page-header";
import { SparklesIcon } from "@/components/icons";
import { requireUser } from "@/lib/auth";
import { getProjects } from "@/lib/data";

export const metadata = { title: "Creator Studio · muse." };

export default async function CreatorPage() {
  const user = await requireUser();
  const projects = await getProjects(user.id, "creator");

  return (
    <div>
      <PageHeader
        eyebrow="Creator studio"
        title="Captions, covers and short-video ideas"
        description="Generate the assets that make people stop scrolling — then save them as projects."
        actions={
          <Link href="/assistant" className="btn btn-secondary btn-sm">
            <SparklesIcon size={14} /> Get a content plan
          </Link>
        }
      />
      <CreatorStudio viewer={user} projects={projects} />
    </div>
  );
}
