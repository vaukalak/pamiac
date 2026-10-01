import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { DocumentScreen } from "@/components/document-screen";
import { DocumentShell } from "@/components/document/document-shell";
import { LockedDocument } from "@/components/locked-document";
import { SetupScreen } from "@/components/setup-screen";
import { resolveAccess, type Visibility } from "@/lib/access";
import { appSecret } from "@/lib/config";
import { getDocumentBundle, isDocumentWorkspaceMember } from "@/lib/documents";
import { documentSpaceLabel, type NamedWorkspace } from "@/lib/library-spaces";
import { loadSharePreview } from "@/lib/load-share-preview";
import { unlockCookieName, unlockMatches } from "@/lib/passwords";
import { sharePageMetadata } from "@/lib/share-preview";
import { getLibrarySession } from "@/lib/session";
import { listMemberWorkspaces } from "@/lib/workspaces";

export const dynamic = "force-dynamic";

interface Properties {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(props: Properties): Promise<Metadata> {
  const { params } = props;
  const { id } = await params;
  return sharePageMetadata(await loadSharePreview(id));
}

export default async function DocumentPage(props: Properties) {
  const { params } = props;
  const { id } = await params;
  if (!process.env.DATABASE_URL) return <SetupScreen />;
  const result = await getLibrarySession();
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
  const workspaceMember = user
    ? await isDocumentWorkspaceMember(user.id, bundle.document.workspaceId)
    : false;
  const access = resolveAccess({
    isOwner: user?.id === bundle.document.ownerId,
    visibility: bundle.document.visibility as Visibility,
    viewerEmail: user?.email ?? null,
    allowedEmails: bundle.emails,
    passwordOk,
    workspaceMember,
  });

  if (access.level === "none") notFound();

  let workspaces: NamedWorkspace[] = [];
  if (user) {
    try {
      workspaces = await listMemberWorkspaces(user.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not reach the database";
      return <SetupScreen detail={message} />;
    }
  }

  const documentType = bundle.document.type === "diagram" ? "diagram" : "note";
  const spaceName = user ? documentSpaceLabel(bundle.document.workspaceId, workspaces) : null;
  const body =
    access.level === "locked" ? (
      <LockedDocument id={id} reason={access.reason} />
    ) : (
      <DocumentScreen
        key={bundle.document.visibility}
        canEdit={access.level === "edit"}
        content={bundle.document.content}
        emails={bundle.emails}
        hasPassword={Boolean(bundle.document.passwordHash)}
        id={bundle.document.id}
        isOwner={access.level === "edit" && access.reason === "owner"}
        spaceName={spaceName}
        title={bundle.document.title}
        type={documentType}
        version={bundle.document.version}
        visibility={bundle.document.visibility as Visibility}
        workspaceId={bundle.document.workspaceId}
      />
    );

  return (
    <DocumentShell
      documentType={documentType}
      email={user?.email ?? null}
      workspaceId={user ? bundle.document.workspaceId : null}
      workspaces={workspaces}
    >
      {body}
    </DocumentShell>
  );
}
