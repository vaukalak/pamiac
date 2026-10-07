import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DocumentBoard, type BoardDocument } from "@/components/library/document-board";
import { WorkspaceInviteDialog } from "@/components/library/workspace-invite-dialog";
import { QueryProvider } from "@/components/query-provider";
import { SetupScreen } from "@/components/setup-screen";
import type { Visibility } from "@/lib/access";
import type { DocumentType } from "@/lib/content";
import { listLibraryDocuments } from "@/lib/documents";
import { privatePageRobots } from "@/lib/indexing";
import { getLibrarySession } from "@/lib/session";
import { workspaceInvitePath } from "@/lib/workspace-invite-link";
import { listMemberWorkspaces } from "@/lib/workspaces";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: privatePageRobots,
};

function setupDetail(error: unknown) {
  const message = error instanceof Error ? error.message : "Could not reach the database";
  if (/relation|does not exist|column/i.test(message)) {
    return `${message}. Run npm run db:migrate.`;
  }
  return message;
}

function inviteIdFromQuery(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() ?? "";
}

interface Properties {
  searchParams: Promise<{ invite?: string | string[] }>;
}

export default async function WorkspacePage(props: Properties) {
  const { searchParams } = props;
  const params = await searchParams;
  const inviteId = inviteIdFromQuery(params.invite);
  const result = await getLibrarySession();
  if (result.status === "setup") return <SetupScreen />;
  if (result.status === "error") return <SetupScreen detail={result.message} />;
  const nextPath = inviteId ? workspaceInvitePath(inviteId) : "/workspace";
  if (!result.session) redirect(`/login?next=${encodeURIComponent(nextPath)}`);

  let rows;
  let workspaces;
  try {
    rows = await listLibraryDocuments(result.session.user.id);
    workspaces = await listMemberWorkspaces(result.session.user.id);
  } catch (error) {
    return <SetupScreen detail={setupDetail(error)} />;
  }
  const documents: BoardDocument[] = rows.map((row) => ({
    id: row.id,
    type: row.type as DocumentType,
    title: row.title,
    content: row.content,
    visibility: row.visibility as Visibility,
    updatedAt: row.updatedAt,
    version: row.version,
    hasPassword: row.hasPassword,
    emails: row.emails,
    workspaceId: row.workspaceId,
    folderId: row.folderId,
  }));

  return (
    <QueryProvider>
      <DocumentBoard
        documents={documents}
        email={result.session.user.email}
        workspaces={workspaces}
      />
      {inviteId ? <WorkspaceInviteDialog inviteId={inviteId} /> : null}
    </QueryProvider>
  );
}
