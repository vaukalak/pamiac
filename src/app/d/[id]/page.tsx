import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/header/app-header";
import { DocumentScreen } from "@/components/document-screen";
import { LockedDocument } from "@/components/locked-document";
import { SetupScreen } from "@/components/setup-screen";
import { resolveAccess, type Visibility } from "@/lib/access";
import { appSecret } from "@/lib/config";
import { getDocumentBundle } from "@/lib/documents";
import { unlockCookieName, unlockMatches } from "@/lib/passwords";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!process.env.DATABASE_URL) return <SetupScreen />;
  const result = await getSession();
  if (result.status === "error") return <SetupScreen detail={result.message} />;

  let bundle;
  try {
    bundle = await getDocumentBundle(id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not reach the database";
    return <SetupScreen detail={message} />;
  }
  if (!bundle) notFound();

  const user = result.session?.user;
  const jar = await cookies();
  const passwordOk = bundle.document.passwordHash
    ? unlockMatches(
        jar.get(unlockCookieName(id))?.value,
        id,
        bundle.document.passwordHash,
        appSecret(),
      )
    : false;
  const access = resolveAccess({
    isOwner: user?.id === bundle.document.ownerId,
    visibility: bundle.document.visibility as Visibility,
    viewerEmail: user?.email ?? null,
    allowedEmails: bundle.emails,
    passwordOk,
  });

  if (access.level === "none") notFound();

  return (
    <>
      <AppHeader email={user?.email} />
      {access.level === "locked" ? (
        <LockedDocument id={id} reason={access.reason} />
      ) : (
        <DocumentScreen
          key={bundle.document.visibility}
          canEdit={access.level === "edit"}
          content={bundle.document.content}
          emails={bundle.emails}
          hasPassword={Boolean(bundle.document.passwordHash)}
          id={bundle.document.id}
          title={bundle.document.title}
          type={bundle.document.type === "diagram" ? "diagram" : "note"}
          version={bundle.document.version}
          visibility={bundle.document.visibility as Visibility}
        />
      )}
    </>
  );
}
