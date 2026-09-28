import { redirect } from "next/navigation";
import { AppHeader } from "@/components/header/app-header";
import { PlanPaywall } from "@/components/plan/plan-paywall";
import { SetupScreen } from "@/components/setup-screen";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const result = await getSession();
  if (result.status === "setup") return <SetupScreen />;
  if (result.status === "error") return <SetupScreen detail={result.message} />;
  if (!result.session) redirect("/login?next=/profile");

  return (
    <>
      <AppHeader email={result.session.user.email} />
      <main className="workspace">
        <PlanPaywall />
      </main>
    </>
  );
}
