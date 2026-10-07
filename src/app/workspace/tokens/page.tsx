import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { QueryProvider } from "@/components/query-provider";
import { SetupScreen } from "@/components/setup-screen";
import { TokenShell } from "@/components/tokens/token-shell";
import { privatePageRobots } from "@/lib/indexing";
import { getSession } from "@/lib/session";
import { listMemberWorkspaces } from "@/lib/workspaces";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: privatePageRobots,
};

export default async function TokensPage() {
  const result = await getSession();
  if (result.status === "setup") return <SetupScreen />;
  if (result.status === "error") return <SetupScreen detail={result.message} />;
  if (!result.session) redirect("/login?next=/workspace/tokens");

  let workspaces;
  try {
    workspaces = await listMemberWorkspaces(result.session.user.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not reach the database";
    return <SetupScreen detail={message} />;
  }

  return (
    <QueryProvider>
      <TokenShell email={result.session.user.email} workspaces={workspaces} />
    </QueryProvider>
  );
}
