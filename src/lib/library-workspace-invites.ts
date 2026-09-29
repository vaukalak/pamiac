export interface WorkspaceInviteDetails {
  id: string;
  workspaceName: string;
}

export const workspaceInviteQueryKey = (inviteId: string) =>
  ["library", "workspace-invite", inviteId] as const;

async function readError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? fallback;
  } catch {
    return fallback;
  }
}

export async function fetchWorkspaceInvite(inviteId: string): Promise<WorkspaceInviteDetails> {
  const response = await fetch(`/api/workspace-invites/${encodeURIComponent(inviteId)}`);
  if (!response.ok) throw new Error(await readError(response, "Could not open the invitation"));
  const body = (await response.json()) as { invite?: WorkspaceInviteDetails };
  if (!body.invite?.workspaceName) throw new Error("Could not open the invitation");
  return body.invite;
}

export async function acceptWorkspaceInvite(inviteId: string) {
  const response = await fetch(`/api/workspace-invites/${encodeURIComponent(inviteId)}/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  if (!response.ok) throw new Error(await readError(response, "Could not accept the invitation"));
}

export async function rejectWorkspaceInvite(inviteId: string) {
  const response = await fetch(`/api/workspace-invites/${encodeURIComponent(inviteId)}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  if (!response.ok) throw new Error(await readError(response, "Could not reject the invitation"));
}
