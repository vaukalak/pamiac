import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { workspaceMembers, workspaces } from "@/db/schema";
import { HttpError } from "@/lib/http";
import { firstMember, workspaceName, type NamedWorkspace } from "@/lib/library-spaces";

function workspaceClientError(error: unknown): HttpError {
  if (error instanceof Error) return new HttpError(400, error.message);
  return new HttpError(400, "Could not create the workspace");
}

export async function listMemberWorkspaces(userId: string): Promise<NamedWorkspace[]> {
  return getDb()
    .select({ id: workspaces.id, name: workspaces.name })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
    .where(eq(workspaceMembers.userId, userId))
    .orderBy(asc(workspaces.createdAt), asc(workspaces.id));
}

export async function createNamedWorkspace(userId: string, name: string): Promise<NamedWorkspace> {
  const id = crypto.randomUUID();
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
    });
  });
  return { id, name: label };
}
