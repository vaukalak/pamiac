import { redirect } from "next/navigation";
import { AppHeader } from "@/components/header/app-header";
import { LoginForm } from "@/components/login-form";
import { SetupScreen } from "@/components/setup-screen";
import { safeNext } from "@/lib/config";
import { oauthAuthorizeResumePath, oauthLoginReturnPath, toSearchParams } from "@/lib/oauth-return";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = toSearchParams(params);
  const next = typeof params.next === "string" ? params.next : null;
  const nextPath = oauthLoginReturnPath(query) ?? safeNext(next);
  const result = await getSession();
  if (result.status === "setup") return <SetupScreen />;
  if (result.status === "error") return <SetupScreen detail={result.message} />;
  if (result.session) redirect(oauthAuthorizeResumePath(query) ?? safeNext(next));

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
          <LoginForm nextPath={nextPath} />
        </section>
      </main>
    </>
  );
}
