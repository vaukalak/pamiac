import type { Metadata } from "next";
import { AppHeader } from "@/components/header/app-header";
import { ConsentCard } from "@/components/oauth/consent-card";
import { ConsentSignIn } from "@/components/oauth/consent-sign-in";
import { SetupScreen } from "@/components/setup-screen";
import { privatePageRobots } from "@/lib/indexing";
import { getSession } from "@/lib/session";
import { consentLoginHref, oauthClientLabel, toSearchParams } from "@/lib/oauth-return";
import { Page } from "@/ui/Page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: privatePageRobots,
};

export default async function ConsentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = toSearchParams(params);
  const result = await getSession();
  if (result.status === "setup") return <SetupScreen />;
  if (result.status === "error") return <SetupScreen detail={result.message} />;

  return (
    <>
      <AppHeader email={result.session?.user.email} />
      <Page className="auth-wrap">
        {result.session ? (
          <ConsentCard clientLabel={oauthClientLabel(query.get("client_id") ?? "")} />
        ) : (
          <ConsentSignIn href={consentLoginHref(query)} />
        )}
      </Page>
    </>
  );
}
