import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { workspaceInvites, workspaceMembers, workspaces } from "@/db/schema";
import { HttpError } from "@/lib/http";
import { workspaceRole, type WorkspaceRole } from "@/lib/library-spaces";
import { sameInviteEmail } from "@/lib/workspace-invite-link";

function inviteMemberRole(role: string | null | undefined): WorkspaceRole {
  if (role === "admin" || role === "editor") return role;
  return workspaceRole("added");
}

async function loadInvite(inviteId: string) {
  const [invite] = await getDb()
    .select({
      id: workspaceInvites.id,
      email: workspaceInvites.email,
      role: workspaceInvites.role,
      workspaceId: workspaceInvites.workspaceId,
      workspaceName: workspaces.name,
    })
    .from(workspaceInvites)
    .innerJoin(workspaces, eq(workspaces.id, workspaceInvites.workspaceId))
    .where(eq(workspaceInvites.id, inviteId));
  return invite ?? null;
}

function inviteForAccount(
  invite: NonNullable<Awaited<ReturnType<typeof loadInvite>>>,
  email: string,
) {
  if (!sameInviteEmail(invite.email, email)) {
    throw new HttpError(403, "This invitation is for a different email");
  }
  return invite;
}

export async function readWorkspaceInvite(email: string, inviteId: string) {
  const invite = await loadInvite(inviteId);
  if (!invite) throw new HttpError(404, "Invitation not found");
  const allowed = inviteForAccount(invite, email);
  return { id: allowed.id, workspaceName: allowed.workspaceName };
}

export async function acceptWorkspaceInvite(userId: string, email: string, inviteId: string) {
  const invite = await loadInvite(inviteId);
  if (!invite) throw new HttpError(404, "Invitation not found");
  const allowed = inviteForAccount(invite, email);
  const db = getDb();
  await db
    .insert(workspaceMembers)
    .values({
      id: crypto.randomUUID(),
      workspaceId: allowed.workspaceId,
      userId,
      role: inviteMemberRole(allowed.role),
    })
    .onConflictDoNothing({
      target: [workspaceMembers.workspaceId, workspaceMembers.userId],
    });
  await db.delete(workspaceInvites).where(eq(workspaceInvites.id, allowed.id));
  return { id: allowed.id, workspaceName: allowed.workspaceName };
}

export async function rejectWorkspaceInvite(email: string, inviteId: string) {
  const invite = await loadInvite(inviteId);
  if (!invite) throw new HttpError(404, "Invitation not found");
  const allowed = inviteForAccount(invite, email);
  await getDb().delete(workspaceInvites).where(eq(workspaceInvites.id, allowed.id));
}
