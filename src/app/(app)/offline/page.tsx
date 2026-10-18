import { OfflineClient } from "@/components/offline-client";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { getProjects } from "@/lib/data";

export const metadata = { title: "Offline mode · muse." };

export default async function OfflinePage() {
  const user = await requireUser();
  const projects = await getProjects(user.id);
  const saved = projects.filter((project) => project.savedOffline);

  return (
    <div>
      <PageHeader
        eyebrow="Offline mode"
        title="Create without the wifi"
        description="Downloaded projects, local tools and a scratchpad that keeps working when the signal doesn't."
      />
      <OfflineClient saved={saved} total={projects.length} />
    </div>
  );
}
