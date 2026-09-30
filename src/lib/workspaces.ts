import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { workspaceMembers, workspaces } from "@/db/schema";
import { HttpError } from "@/lib/http";
import {
  firstMember,
  isWorkspaceAdmin,
  PERSONAL_SPACE_ID,
  workspaceName,
  workspaceRole,
  type NamedWorkspace,
} from "@/lib/library-spaces";

function workspaceClientError(error: unknown): HttpError {
  if (error instanceof Error) return new HttpError(400, error.message);
  return new HttpError(400, "Could not create the workspace");
}

export async function listMemberWorkspaces(userId: string): Promise<NamedWorkspace[]> {
  return getDb()
    .select({
      id: workspaces.id,
      name: workspaces.name,
      role: workspaceMembers.role,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
    .where(eq(workspaceMembers.userId, userId))
    .orderBy(asc(workspaces.createdAt), asc(workspaces.id));
}

export async function createNamedWorkspace(userId: string, name: string): Promise<NamedWorkspace> {
  const id = crypto.randomUUID();
  const role = workspaceRole("creator");
  let label: string;
  let member: ReturnType<typeof firstMember>;
  try {
    label = workspaceName(name);
    member = firstMember(id, userId);
  } catch (error) {
    throw workspaceClientError(error);
  }
  await getDb().transaction(async (tx) => {
    await tx.insert(workspaces).values({ id, name: label });
    await tx.insert(workspaceMembers).values({
      id: crypto.randomUUID(),
      workspaceId: member.workspaceId,
      userId: member.userId,
      role,
    });
  });
  return { id, name: label, role };
}

export async function renameWorkspace(userId: string, workspaceId: string, name: string) {
  if (workspaceId === PERSONAL_SPACE_ID) {
    throw new HttpError(400, "Personal space cannot be renamed");
  }
  let label: string;
  try {
    label = workspaceName(name);
  } catch (error) {
    throw workspaceClientError(error);
  }
  const db = getDb();
  const [membership] = await db
    .select({ role: workspaceMembers.role })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)));
  if (!membership) throw new HttpError(404, "Workspace not found");
  if (!isWorkspaceAdmin(membership.role)) {
    throw new HttpError(403, "Only an admin can rename this workspace");
  }
  const [updated] = await db
    .update(workspaces)
    .set({ name: label })
    .where(eq(workspaces.id, workspaceId))
    .returning({ id: workspaces.id, name: workspaces.name });
  if (!updated) throw new HttpError(404, "Workspace not found");
  return updated;
}

export async function leaveWorkspace(userId: string, workspaceId: string) {
  if (workspaceId === PERSONAL_SPACE_ID) {
    throw new HttpError(400, "Personal space has no members");
  }
  const [membership] = await getDb()
    .select({ id: workspaceMembers.id })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)));
  if (!membership) throw new HttpError(404, "Workspace not found");
  await getDb().delete(workspaceMembers).where(eq(workspaceMembers.id, membership.id));
}
