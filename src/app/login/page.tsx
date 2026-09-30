import { redirect } from "next/navigation";
import { AppHeader } from "@/components/header/app-header";
import { CircuitBoard } from "@/components/home/circuit-board";
import { LoginForm } from "@/components/login-form";
import { SetupScreen } from "@/components/setup-screen";
import { safeNext } from "@/lib/config";
import { devMagicLinkVisible } from "@/lib/dev-magic-link";
import { loginSentBootScript } from "@/lib/login-sent-memory";
import { oauthAuthorizeResumePath, oauthLoginReturnPath, toSearchParams } from "@/lib/oauth-return";
import { getLibrarySession, getSession } from "@/lib/session";
import { Page } from "@/ui/Page";
import { Section } from "@/ui/Section";

export const dynamic = "force-dynamic";

interface Properties {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LoginPage(props: Properties) {
  const { searchParams } = props;
  const params = await searchParams;
  const query = toSearchParams(params);
  const next = typeof params.next === "string" ? params.next : null;
  const oauthResume = oauthAuthorizeResumePath(query);
  const nextPath = oauthResume ?? safeNext(next);
  const formNext = oauthLoginReturnPath(query) ?? nextPath;
  const result = oauthResume ? await getSession() : await getLibrarySession();
  if (result.status === "setup") return <SetupScreen />;
  if (result.status === "error") return <SetupScreen detail={result.message} />;
  if (result.session) redirect(nextPath);

  const showDevLink = devMagicLinkVisible();

  return (
    <div className="home">
      <CircuitBoard />
      <AppHeader />
      <Page className="home-sign-in">
        <script dangerouslySetInnerHTML={{ __html: loginSentBootScript() }} />
        <Section className="home-sign-in-panel">
          <LoginForm nextPath={formNext} showDevLink={showDevLink} />
        </Section>
      </Page>
      <footer className="home-foot">
        <p>Built for human ideas and machine intelligence.</p>
      </footer>
    </div>
  );
}
