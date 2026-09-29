import { redirect } from "next/navigation";
import { AppHeader } from "@/components/header/app-header";
import { DocumentBoard, type BoardDocument } from "@/components/library/document-board";
import { QueryProvider } from "@/components/query-provider";
import { SetupScreen } from "@/components/setup-screen";
import type { Visibility } from "@/lib/access";
import type { DocumentType } from "@/lib/content";
import { listLibraryDocuments } from "@/lib/documents";
import { getSession } from "@/lib/session";
import { listMemberWorkspaces } from "@/lib/workspaces";

export const dynamic = "force-dynamic";

function setupDetail(error: unknown) {
  const message = error instanceof Error ? error.message : "Could not reach the database";
  if (/relation|does not exist|column/i.test(message)) {
    return `${message}. Run npm run db:push.`;
  }
  return message;
}

export default async function WorkspacePage() {
  const result = await getSession();
  if (result.status === "setup") return <SetupScreen />;
  if (result.status === "error") return <SetupScreen detail={result.message} />;
  if (!result.session) redirect("/login?next=/workspace");

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
  }));

  return (
    <>
      <AppHeader email={result.session.user.email} />
      <main className="workspace">
        <QueryProvider>
          <DocumentBoard documents={documents} workspaces={workspaces} />
        </QueryProvider>
      </main>
    </>
  );
}
