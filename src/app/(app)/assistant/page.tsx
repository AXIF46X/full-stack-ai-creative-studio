import { AssistantClient } from "@/components/assistant-client";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { getAssistantMessages, getChallenges, getGroups, getProjects } from "@/lib/data";

export const metadata = { title: "Muse AI · muse." };

export default async function AssistantPage() {
  const user = await requireUser();
  const [messages, projects, challenges, groups] = await Promise.all([
    getAssistantMessages(user.id),
    getProjects(user.id),
    getChallenges(user.id),
    getGroups(user.id),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="AI assistant"
        title="Meet Muse"
        description="Personalized recommendations, creative ideas and instant help — tuned to your interests and projects."
      />
      <AssistantClient
        viewer={user}
        messages={messages}
        context={{
          projects: projects.length,
          drafts: projects.filter((project) => project.status !== "published").length,
          groups: groups.filter((group) => group.joined).length,
          challenges: challenges.filter((challenge) => !challenge.done).length,
        }}
      />
    </div>
  );
}
