import type { NamedWorkspace, WorkspacePerson, WorkspaceRole } from "@/lib/library-spaces";

export interface WorkspaceRosterMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: WorkspaceRole;
  createdAt: string;
}

export interface WorkspaceRosterPending {
  id: string;
  email: string;
  createdAt: string;
}

export interface WorkspaceRoster {
  members: WorkspaceRosterMember[];
  invites: WorkspaceRosterPending[];
}

export const workspacesQueryKey = ["library", "workspaces"] as const;

export async function fetchWorkspaces(): Promise<NamedWorkspace[]> {
  const response = await fetch("/api/workspaces");
  if (!response.ok) throw new Error("Could not load workspaces");
  const body = (await response.json()) as { workspaces?: NamedWorkspace[] };
  if (!Array.isArray(body.workspaces)) throw new Error("Could not load workspaces");
  return body.workspaces;
}

export function workspacesQueryOptions() {
  return {
    queryKey: workspacesQueryKey,
    queryFn: fetchWorkspaces,
    refetchOnWindowFocus: true,
    staleTime: 0,
  };
}

export async function createWorkspace(name: string): Promise<NamedWorkspace> {
  const response = await fetch("/api/workspaces", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  const body = (await response.json()) as { workspace?: NamedWorkspace; error?: string };
  if (!response.ok || !body.workspace) {
    throw new Error(body.error ?? "Could not create the workspace");
  }
  return body.workspace;
}

export async function addWorkspacePerson(
  workspaceId: string,
  email: string,
): Promise<WorkspacePerson> {
  const response = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const body = (await response.json()) as { person?: WorkspacePerson; error?: string };
  if (!response.ok || !body.person) {
    throw new Error(body.error ?? "Could not add that person");
  }
  return body.person;
}

export async function renameWorkspace(workspaceId: string, name: string) {
  const response = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  const body = (await response.json()) as {
    workspace?: { id: string; name: string };
    error?: string;
  };
  if (!response.ok || !body.workspace) {
    throw new Error(body.error ?? "Could not rename the workspace");
  }
  return body.workspace;
}

export function workspaceRosterQueryKey(workspaceId: string) {
  return ["library", "roster", workspaceId] as const;
}

export async function fetchWorkspaceRoster(workspaceId: string): Promise<WorkspaceRoster> {
  const response = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/members`);
  if (!response.ok) throw new Error("Could not load members");
  const body = (await response.json()) as Partial<WorkspaceRoster>;
  if (!Array.isArray(body.members) || !Array.isArray(body.invites)) {
    throw new Error("Could not load members");
  }
  return { members: body.members, invites: body.invites };
}

export function workspaceRosterQueryOptions(workspaceId: string) {
  return {
    queryKey: workspaceRosterQueryKey(workspaceId),
    queryFn: () => fetchWorkspaceRoster(workspaceId),
  };
}

export async function updateWorkspaceMemberRole(
  workspaceId: string,
  memberId: string,
  role: WorkspaceRole,
) {
  const response = await fetch(
    `/api/workspaces/${encodeURIComponent(workspaceId)}/members/${encodeURIComponent(memberId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    },
  );
  if (response.ok) return;
  const body = (await response.json()) as { error?: string };
  throw new Error(body.error ?? "Could not change that role");
}

export async function resendWorkspacePending(workspaceId: string, pendingId: string) {
  const response = await fetch(
    `/api/workspaces/${encodeURIComponent(workspaceId)}/invites/${encodeURIComponent(pendingId)}/resend`,
    { method: "POST" },
  );
  if (response.ok) return;
  const body = (await response.json()) as { error?: string };
  throw new Error(body.error ?? "Could not send that email again");
}

export async function deleteWorkspace(workspaceId: string): Promise<void> {
  const response = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}`, {
    method: "DELETE",
  });
  if (response.ok) return;
  const body = (await response.json()) as { error?: string };
  throw new Error(body.error ?? "Could not delete the workspace");
}

export async function leaveWorkspace(workspaceId: string): Promise<void> {
  const response = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/leave`, {
    method: "POST",
  });
  if (response.ok) return;
  const body = (await response.json()) as { error?: string };
  throw new Error(body.error ?? "Could not leave the workspace");
}
