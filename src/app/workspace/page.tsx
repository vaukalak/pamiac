import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { DocumentBoard, type BoardDocument } from "@/components/document-board";
import { SetupScreen } from "@/components/setup-screen";
import { listDocuments } from "@/lib/documents";
import type { DocumentType } from "@/lib/content";
import { getSession } from "@/lib/session";

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
  try {
    rows = await listDocuments(result.session.user.id);
  } catch (error) {
    return <SetupScreen detail={setupDetail(error)} />;
  }
  const documents: BoardDocument[] = rows.map((row) => ({
    id: row.id,
    type: row.type as DocumentType,
    title: row.title,
    content: row.content,
    visibility: row.visibility,
    updatedAt: row.updatedAt.toISOString(),
  }));

  return (
    <>
      <AppHeader email={result.session.user.email} />
      <main className="workspace">
        <DocumentBoard documents={documents} />
      </main>
    </>
  );
}
