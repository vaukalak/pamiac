import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { PrivateFolder } from "@/components/folder/private-folder";
import { SharedFolder } from "@/components/folder/shared-folder";
import { DocumentShell } from "@/components/document/document-shell";
import { LockedDocument } from "@/components/locked-document";
import { SetupScreen } from "@/components/setup-screen";
import { resolveInheritedAccess, type ShareGrant } from "@/lib/access";
import { appSecret } from "@/lib/config";
import { isDocumentWorkspaceMember } from "@/lib/documents";
import { folderGrantChain, getFolderBundle, listDirectFolderContents } from "@/lib/folders";
import type { NamedWorkspace } from "@/lib/library-spaces";
import { unlockCookieName, unlockMatches } from "@/lib/passwords";
import { getLibrarySession } from "@/lib/session";
import { listMemberWorkspaces } from "@/lib/workspaces";

export const dynamic = "force-dynamic";

interface Properties {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Folder" };
}

export default async function FolderPage(props: Properties) {
  const { params } = props;
  const { id } = await params;
  if (!process.env.DATABASE_URL) return <SetupScreen />;
  const result = await getLibrarySession();
  if (result.status === "error") return <SetupScreen detail={result.message} />;

  let bundle;
  let ancestors;
  try {
    bundle = await getFolderBundle(id);
    ancestors = bundle ? await folderGrantChain(bundle.folder.parentId) : [];
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not reach the database";
    return <SetupScreen detail={message} />;
  }
  if (!bundle) notFound();

  const user = result.session?.user;
  const jar = await cookies();
  const secret = appSecret();
  const grants: ShareGrant[] = [
    {
      id: bundle.folder.id,
      kind: "folder",
      visibility: bundle.folder.visibility,
      allowedEmails: bundle.emails,
      passwordOk: bundle.folder.passwordHash
        ? unlockMatches(
            jar.get(unlockCookieName(bundle.folder.id))?.value,
            bundle.folder.id,
            bundle.folder.passwordHash,
            secret,
          )
        : false,
    },
    ...ancestors.map((grant) => ({
      id: grant.id,
      kind: "folder" as const,
      visibility: grant.visibility,
      allowedEmails: grant.allowedEmails,
      passwordOk: grant.passwordHash
        ? unlockMatches(
            jar.get(unlockCookieName(grant.id))?.value,
            grant.id,
            grant.passwordHash,
            secret,
          )
        : false,
    })),
  ];
  const workspaceMember = user
    ? await isDocumentWorkspaceMember(user.id, bundle.folder.workspaceId)
    : false;
  const access = resolveInheritedAccess({
    isOwner: user?.id === bundle.folder.ownerId,
    viewerEmail: user?.email ?? null,
    grants,
    workspaceMember,
  });

  let workspaces: NamedWorkspace[] = [];
  if (user) {
    try {
      workspaces = await listMemberWorkspaces(user.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not reach the database";
      return <SetupScreen detail={message} />;
    }
  }

  let body;
  if (access.level === "none") {
    body = <PrivateFolder id={id} signedIn={Boolean(user)} />;
  } else if (access.level === "locked") {
    body = (
      <LockedDocument
        id={id}
        nextPath={`/f/${id}`}
        reason={access.reason}
        unlockId={access.unlockId}
        unlockKind={access.unlockKind}
      />
    );
  } else {
    let contents;
    try {
      contents = await listDirectFolderContents(id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not reach the database";
      return <SetupScreen detail={message} />;
    }
    body = (
      <SharedFolder
        documents={contents.documents}
        folders={contents.folders}
        name={bundle.folder.name}
      />
    );
  }

  return (
    <DocumentShell
      documentType="note"
      email={user?.email ?? null}
      workspaceId={user ? bundle.folder.workspaceId : null}
      workspaces={workspaces}
    >
      {body}
    </DocumentShell>
  );
}
