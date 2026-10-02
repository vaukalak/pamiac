import { redirect } from "next/navigation";
import { ConnectExpired } from "@/components/connect/connect-expired";
import { ConnectFinished } from "@/components/connect/connect-finished";
import { ConnectReturn } from "@/components/connect/connect-return";
import { SetupScreen } from "@/components/setup-screen";
import { claimResult } from "@/lib/agent-connect";
import { findAgentConnect } from "@/lib/agent-connect-db";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

interface Properties {
  params: Promise<{ id: string }>;
}

export default async function ConnectPage(props: Properties) {
  const { params } = props;
  const { id } = await params;
  const result = await getSession();
  if (result.status === "setup") return <SetupScreen />;
  if (result.status === "error") return <SetupScreen detail={result.message} />;
  if (!result.session) {
    redirect(`/login?next=${encodeURIComponent(`/connect/${id}`)}`);
  }

  const email = result.session.user.email;
  let row;
  try {
    row = await findAgentConnect(id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not reach the database";
    return <SetupScreen detail={message} />;
  }

  if (!row) return <ConnectExpired email={email} />;
  const status = claimResult(row, new Date());
  if (status === "expired") return <ConnectExpired email={email} />;
  if (status === "pending") {
    return <ConnectReturn agentName={row.agentName} connectId={row.id} email={email} />;
  }
  return <ConnectFinished agentName={row.agentName} email={email} />;
}
