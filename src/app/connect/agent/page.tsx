import { ConnectAgentInstructions } from "@/components/connect/connect-agent-instructions";
import { ConnectAgentSignIn } from "@/components/connect/connect-agent-sign-in";
import { ConnectAgentSignedIn } from "@/components/connect/connect-agent-signed-in";
import { CircuitBoard } from "@/components/home/circuit-board";
import { AppHeader } from "@/components/header/app-header";
import { SetupScreen } from "@/components/setup-screen";
import { getSession } from "@/lib/session";
import { Page } from "@/ui/Page";
import { Section } from "@/ui/Section";

export const dynamic = "force-dynamic";

export default async function ConnectAgentPage() {
  const result = await getSession();
  if (result.status === "setup") return <SetupScreen />;
  if (result.status === "error") return <SetupScreen detail={result.message} />;
  const email = result.session?.user.email ?? null;

  return (
    <div className="home">
      <CircuitBoard />
      <AppHeader email={email} />
      <Page className="connect-agent-page">
        <Section className="token-connect connect-agent-panel">
          {result.session ? <ConnectAgentSignedIn /> : <ConnectAgentSignIn />}
        </Section>
        <ConnectAgentInstructions />
      </Page>
    </div>
  );
}
