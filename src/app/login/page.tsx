import { redirect } from "next/navigation";
import { AppHeader } from "@/components/header/app-header";
import { LoginForm } from "@/components/login-form";
import { SetupScreen } from "@/components/setup-screen";
import { safeNext } from "@/lib/config";
import { oauthAuthorizeResumePath, oauthLoginReturnPath, toSearchParams } from "@/lib/oauth-return";
import { getLibrarySession, getSession } from "@/lib/session";

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
      <main className="auth-wrap">
        <section className="auth-card">
          <p className="eyebrow">Account</p>
          <h1>Sign in or register</h1>
          <p>
            We email you a magic link. If the address is new, opening the link creates the account.
          </p>
          <LoginForm nextPath={formNext} />
        </section>
      </main>
    </>
  );
}
