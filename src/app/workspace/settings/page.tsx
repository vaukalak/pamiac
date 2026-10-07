import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { QueryProvider } from "@/components/query-provider";
import { SetupScreen } from "@/components/setup-screen";
import { WorkspaceSettingsScreen } from "@/components/workspace-settings/workspace-settings-screen";
import { privatePageRobots } from "@/lib/indexing";
import { getLibrarySession } from "@/lib/session";
import { listMemberWorkspaces } from "@/lib/workspaces";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: privatePageRobots,
};

function setupDetail(error: unknown) {
  const message = error instanceof Error ? error.message : "Could not reach the database";
  if (/relation|does not exist|column/i.test(message)) {
    return `${message}. Run npm run db:migrate.`;
  }
  return message;
}

export default async function WorkspaceSettingsPage() {
  const result = await getLibrarySession();
  if (result.status === "setup") return <SetupScreen />;
  if (result.status === "error") return <SetupScreen detail={result.message} />;
  if (!result.session) redirect(`/login?next=${encodeURIComponent("/workspace/settings")}`);

  let workspaces;
  try {
    workspaces = await listMemberWorkspaces(result.session.user.id);
  } catch (error) {
    return <SetupScreen detail={setupDetail(error)} />;
  }

  return (
    <QueryProvider>
      <WorkspaceSettingsScreen email={result.session.user.email} workspaces={workspaces} />
    </QueryProvider>
  );
}
