import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { user, workspaceInvites, workspaceMembers } from "@/db/schema";
import { HttpError } from "@/lib/http";
import { PERSONAL_SPACE_ID, workspacePerson, type WorkspacePerson } from "@/lib/library-spaces";

function clientError(error: unknown): HttpError {
  if (error instanceof HttpError) return error;
  if (error instanceof Error) return new HttpError(400, error.message);
  return new HttpError(400, "Could not add that person");
}

async function accountIdForEmail(email: string) {
  const rows = await getDb()
    .select({ id: user.id, email: user.email })
    .from(user)
    .where(sql`lower(${user.email}) = ${email}`);
  return (rows.find((row) => row.email.toLowerCase() === email) ?? rows[0])?.id ?? null;
}

export async function addWorkspacePerson(
  actorId: string,
  workspaceId: string,
  email: string,
): Promise<WorkspacePerson> {
  if (workspaceId === PERSONAL_SPACE_ID) {
    throw new HttpError(400, "Personal space cannot receive members");
  }
  const db = getDb();
  const [membership] = await db
    .select({ workspaceId: workspaceMembers.workspaceId })
    .from(workspaceMembers)
    .where(
      and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, actorId)),
    );
  if (!membership) throw new HttpError(404, "Workspace not found");

  let pending: WorkspacePerson;
  try {
    pending = workspacePerson(workspaceId, email, null);
  } catch (error) {
    throw clientError(error);
  }
  if (pending.status !== "pending") throw new HttpError(400, "Add an email address");
  const accountId = await accountIdForEmail(pending.email);
  const person = accountId ? workspacePerson(workspaceId, email, accountId) : pending;

  if (person.status === "member") {
    await db
      .insert(workspaceMembers)
      .values({
        id: crypto.randomUUID(),
        workspaceId: person.workspaceId,
        userId: person.userId,
      })
      .onConflictDoNothing({
        target: [workspaceMembers.workspaceId, workspaceMembers.userId],
      });
    return person;
  }

  await db
    .insert(workspaceInvites)
    .values({
      id: crypto.randomUUID(),
      workspaceId: person.workspaceId,
      email: person.email,
    })
    .onConflictDoNothing({
      target: [workspaceInvites.workspaceId, workspaceInvites.email],
    });
  return person;
}
