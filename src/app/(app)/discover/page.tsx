import { DiscoverClient } from "@/components/discover-client";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { getCreators, getTrends } from "@/lib/data";

export const metadata = { title: "Discover · muse." };

export default async function DiscoverPage() {
  const user = await requireUser();
  const [trends, creators] = await Promise.all([getTrends(), getCreators(user.id)]);

  return (
    <div>
      <PageHeader
        eyebrow="Trending discover"
        title="Catch it before it peaks"
        description="Popular music, memes, styles and creator content — refreshed from what your scene is making."
      />
      <DiscoverClient trends={trends} creators={creators} searchHint="⌘K for smart search" />
    </div>
  );
}
