import { GoogleConnectDecision } from "@/components/connect/google-connect-decision";
import { GoogleConnectSignIn } from "@/components/connect/google-connect-sign-in";
import { AppHeader } from "@/components/header/app-header";
import { CircuitBoard } from "@/components/home/circuit-board";
import { SetupScreen } from "@/components/setup-screen";
import { findGoogleLoginAgentName } from "@/lib/google-agent-login";
import { getSession } from "@/lib/session";
import { Page } from "@/ui/Page";
import { Section } from "@/ui/Section";

export const dynamic = "force-dynamic";

interface Properties {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ConnectGooglePage(props: Properties) {
  const { searchParams } = props;
  const params = await searchParams;
  const userCode = typeof params.user_code === "string" ? params.user_code : "";
  const result = await getSession();
  if (result.status === "setup") return <SetupScreen />;
  if (result.status === "error") return <SetupScreen detail={result.message} />;
  const email = result.session?.user.email ?? null;
  let agentName = "agent";
  if (result.session) {
    try {
      agentName = await findGoogleLoginAgentName(userCode);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not reach the database";
      return <SetupScreen detail={message} />;
    }
  }

  return (
    <div className="home">
      <CircuitBoard />
      <AppHeader email={email} />
      <Page className="home-sign-in">
        <Section className="home-sign-in-panel">
          {result.session ? (
            <GoogleConnectDecision agentName={agentName} userCode={userCode} />
          ) : (
            <GoogleConnectSignIn userCode={userCode} />
          )}
        </Section>
      </Page>
    </div>
  );
}
