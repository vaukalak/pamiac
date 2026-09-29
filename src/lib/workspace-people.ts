import { and, count, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { user, workspaceInvites, workspaceMembers } from "@/db/schema";
import { HttpError } from "@/lib/http";
import { PERSONAL_SPACE_ID, workspacePerson, type WorkspacePerson } from "@/lib/library-spaces";
import { currentWorkspacePlan, memberRoom } from "@/lib/plans";

function clientError(error: unknown): HttpError {
  if (error instanceof HttpError) return error;
  if (error instanceof Error) return new HttpError(400, error.message);
  return new HttpError(400, "Could not add that person");
}

function asCount(value: unknown) {
  const total = Number(value ?? 0);
  return Number.isFinite(total) ? total : 0;
}

async function workspacePeopleCount(workspaceId: string) {
  const db = getDb();
  const [members] = await db
    .select({ total: count() })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.workspaceId, workspaceId));
  const [invites] = await db
    .select({ total: count() })
    .from(workspaceInvites)
    .where(eq(workspaceInvites.workspaceId, workspaceId));
  return asCount(members?.total) + asCount(invites?.total);
}

async function personAlreadyCounted(workspaceId: string, person: WorkspacePerson, email: string) {
  const db = getDb();
  if (person.status === "member") {
    const [member] = await db
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, person.userId),
        ),
      );
    if (member) return true;
  }
  const [invite] = await db
    .select({ id: workspaceInvites.id })
    .from(workspaceInvites)
    .where(and(eq(workspaceInvites.workspaceId, workspaceId), eq(workspaceInvites.email, email)));
  return Boolean(invite);
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
  const counted = await personAlreadyCounted(person.workspaceId, person, pending.email);
  if (!counted) {
    const people = await workspacePeopleCount(person.workspaceId);
    const room = memberRoom(people, currentWorkspacePlan());
    if (room) throw new HttpError(403, room);
  }

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
    await db
      .delete(workspaceInvites)
      .where(
        and(
          eq(workspaceInvites.workspaceId, person.workspaceId),
          eq(workspaceInvites.email, pending.email),
        ),
      );
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
