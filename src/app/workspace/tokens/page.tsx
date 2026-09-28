import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { SetupScreen } from "@/components/setup-screen";
import { TokenManager } from "@/components/token-manager";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function TokensPage() {
  const result = await getSession();
  if (result.status === "setup") return <SetupScreen />;
  if (result.status === "error") return <SetupScreen detail={result.message} />;
  if (!result.session) redirect("/login?next=/workspace/tokens");

  return (
    <>
      <AppHeader email={result.session.user.email} />
      <main className="workspace">
        <TokenManager />
      </main>
    </>
  );
}
