import { CommunityClient } from "@/components/community-client";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { getCreators, getFeed, getGroups } from "@/lib/data";

export const metadata = { title: "Community · muse." };

export default async function CommunityPage() {
  const user = await requireUser();
  const [groups, creators, posts] = await Promise.all([getGroups(user.id), getCreators(user.id), getFeed(user.id)]);

  return (
    <div>
      <PageHeader
        eyebrow="Social community"
        title="Find the rooms where your work makes sense"
        description="Join interest groups, meet creators in your lane, and give feedback that actually helps."
      />
      <CommunityClient viewer={user} groups={groups} creators={creators.filter((creator) => !creator.blocked)} posts={posts} />
    </div>
  );
}
