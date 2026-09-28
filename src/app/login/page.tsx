import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { LoginForm } from "@/components/login-form";
import { SetupScreen } from "@/components/setup-screen";
import { safeNext } from "@/lib/config";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = safeNext(params.next);
  const result = await getSession();
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
          <p>We email you a magic link. If the address is new, opening the link creates the account.</p>
          <LoginForm nextPath={nextPath} />
        </section>
      </main>
    </>
  );
}
