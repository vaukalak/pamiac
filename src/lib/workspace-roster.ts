import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { user, workspaceInvites, workspaceMembers, workspaces } from "@/db/schema";
import { appBaseUrl } from "@/lib/config";
import { HttpError } from "@/lib/http";
import { isWorkspaceAdmin, PERSONAL_SPACE_ID, type WorkspaceRole } from "@/lib/library-spaces";
import { sendWorkspaceInvite } from "@/lib/mail";
import { workspaceInvitePath } from "@/lib/workspace-invite-link";

function isoTime(value: Date) {
  return value.toISOString();
}

async function membershipFor(actorId: string, workspaceId: string) {
  if (workspaceId === PERSONAL_SPACE_ID) {
    throw new HttpError(400, "Personal space has no shared members");
  }
  const [membership] = await getDb()
    .select({ role: workspaceMembers.role, userId: workspaceMembers.userId })
    .from(workspaceMembers)
    .where(
      and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, actorId)),
    );
  if (!membership) throw new HttpError(404, "Workspace not found");
  return membership;
}

function requireAdmin(role: string) {
  if (!isWorkspaceAdmin(role)) {
    throw new HttpError(403, "Only an admin can manage members");
  }
}

export async function listWorkspaceRoster(actorId: string, workspaceId: string) {
  await membershipFor(actorId, workspaceId);
  const db = getDb();
  const members = await db
    .select({
      id: workspaceMembers.id,
      userId: workspaceMembers.userId,
      name: user.name,
      email: user.email,
      role: workspaceMembers.role,
      createdAt: workspaceMembers.createdAt,
    })
    .from(workspaceMembers)
    .innerJoin(user, eq(user.id, workspaceMembers.userId))
    .where(eq(workspaceMembers.workspaceId, workspaceId))
    .orderBy(asc(workspaceMembers.createdAt), asc(workspaceMembers.id));
  const pending = await db
    .select({
      id: workspaceInvites.id,
      email: workspaceInvites.email,
      role: workspaceInvites.role,
      createdAt: workspaceInvites.createdAt,
    })
    .from(workspaceInvites)
    .where(eq(workspaceInvites.workspaceId, workspaceId))
    .orderBy(asc(workspaceInvites.createdAt), asc(workspaceInvites.id));
  return {
    members: members.map((member) => ({
      id: member.id,
      userId: member.userId,
      name: member.name,
      email: member.email,
      role: member.role,
      createdAt: isoTime(member.createdAt),
    })),
    invites: pending.map((row) => ({
      id: row.id,
      email: row.email,
      role: row.role,
      createdAt: isoTime(row.createdAt),
    })),
  };
}

export async function changeWorkspaceMemberRole(
  actorId: string,
  workspaceId: string,
  memberId: string,
  role: WorkspaceRole,
) {
  const actor = await membershipFor(actorId, workspaceId);
  requireAdmin(actor.role);
  const [target] = await getDb()
    .select({ id: workspaceMembers.id, userId: workspaceMembers.userId })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.id, memberId), eq(workspaceMembers.workspaceId, workspaceId)));
  if (!target) throw new HttpError(404, "Member not found");
  if (target.userId === actorId) {
    throw new HttpError(403, "You cannot change your own role");
  }
  await getDb().update(workspaceMembers).set({ role }).where(eq(workspaceMembers.id, target.id));
}

export async function resendWorkspacePending(
  actorId: string,
  workspaceId: string,
  pendingId: string,
) {
  const actor = await membershipFor(actorId, workspaceId);
  requireAdmin(actor.role);
  const db = getDb();
  const [pending] = await db
    .select({ id: workspaceInvites.id, email: workspaceInvites.email })
    .from(workspaceInvites)
    .where(and(eq(workspaceInvites.id, pendingId), eq(workspaceInvites.workspaceId, workspaceId)));
  if (!pending) throw new HttpError(404, "That address is not waiting");
  const [workspace] = await db
    .select({ name: workspaces.name })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId));
  if (!workspace) throw new HttpError(404, "Workspace not found");
  try {
    await sendWorkspaceInvite({
      email: pending.email,
      workspaceName: workspace.name,
      url: `${appBaseUrl()}${workspaceInvitePath(pending.id)}`,
    });
  } catch (error) {
    console.error(error);
    throw new HttpError(502, "Could not send the invitation email");
  }
}
