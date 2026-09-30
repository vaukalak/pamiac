import { redirect } from "next/navigation";
import { AppHeader } from "@/components/header/app-header";
import { LoginForm } from "@/components/login-form";
import { SetupScreen } from "@/components/setup-screen";
import { safeNext } from "@/lib/config";
import { loginSentBootScript } from "@/lib/login-sent-memory";
import { oauthAuthorizeResumePath, oauthLoginReturnPath, toSearchParams } from "@/lib/oauth-return";
import { getLibrarySession, getSession } from "@/lib/session";
import { Page } from "@/ui/Page";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
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

  return (
    <>
      <AppHeader />
      <Page className="hero sign-in">
        <script dangerouslySetInnerHTML={{ __html: loginSentBootScript() }} />
        <LoginForm nextPath={formNext} />
      </Page>
    </>
  );
}
