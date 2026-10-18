import { MarketplaceClient } from "@/components/marketplace-client";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { getMarketItems } from "@/lib/data";

export const metadata = { title: "Marketplace · muse." };

export default async function MarketplacePage() {
  const user = await requireUser();
  const items = await getMarketItems(user.id);

  return (
    <div>
      <PageHeader
        eyebrow="Monetization"
        title="Plans, premium tools and the creator marketplace"
        description="Upgrade for unlimited projects and pro tools — or support creators by buying their packs."
      />
      <MarketplaceClient viewer={user} items={items} />
    </div>
  );
}
