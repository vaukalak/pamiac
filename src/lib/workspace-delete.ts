import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { documents, workspaceMembers, workspaces } from "@/db/schema";
import { HttpError } from "@/lib/http";
import { isWorkspaceAdmin, PERSONAL_SPACE_ID } from "@/lib/library-spaces";

export async function deleteWorkspace(userId: string, workspaceId: string) {
  if (workspaceId === PERSONAL_SPACE_ID) {
    throw new HttpError(400, "Personal space cannot be deleted");
  }
  const db = getDb();
  const [membership] = await db
    .select({ role: workspaceMembers.role })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)));
  if (!membership) throw new HttpError(404, "Workspace not found");
  if (!isWorkspaceAdmin(membership.role)) {
    throw new HttpError(403, "Only an admin can delete a workspace");
  }
  await db.transaction(async (tx) => {
    await tx.delete(documents).where(eq(documents.workspaceId, workspaceId));
    await tx.delete(workspaces).where(eq(workspaces.id, workspaceId));
  });
}
