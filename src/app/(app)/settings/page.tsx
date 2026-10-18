import { PageHeader } from "@/components/page-header";
import { SettingsClient } from "@/components/settings-client";
import { requireUser } from "@/lib/auth";
import { getBlockedUsers, getCreators, getMyReports } from "@/lib/data";

export const metadata = { title: "Settings · muse." };

export default async function SettingsPage() {
  const user = await requireUser();
  const [blocked, reports, creators] = await Promise.all([getBlockedUsers(user.id), getMyReports(user.id), getCreators(user.id)]);

  return (
    <div>
      <PageHeader
        eyebrow="Privacy & customization"
        title="Make Muse feel like yours"
        description="Profile, themes, avatars, privacy controls and the safety tools that keep this place good."
      />
      <SettingsClient viewer={user} blocked={blocked} reports={reports} blockable={creators} />
    </div>
  );
}
