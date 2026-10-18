import Link from "next/link";
import { FeedClient } from "@/components/feed-client";
import { SparklesIcon } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { getFeed, getTrends } from "@/lib/data";

export const metadata = { title: "Feed · muse." };

export default async function FeedPage() {
  const user = await requireUser();
  const [posts, trends] = await Promise.all([getFeed(user.id), getTrends()]);

  const creators = [...new Map(posts.map((post) => [post.author.id, post.author])).values()];

  return (
    <div>
      <PageHeader
        eyebrow="Personalized feed"
        title="Your feed, your frequency"
        description="Creations from the people in your niche. React, comment, remix, repeat."
        actions={
          <Link href="/assistant" className="btn btn-secondary btn-sm">
            <SparklesIcon size={14} /> Ask Muse what to post
          </Link>
        }
      />
      <FeedClient viewer={user} posts={posts} trends={trends} creators={creators} />
    </div>
  );
}
