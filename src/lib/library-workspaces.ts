import type { NamedWorkspace, WorkspacePerson } from "@/lib/library-spaces";

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

export async function leaveWorkspace(workspaceId: string): Promise<void> {
  const response = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/leave`, {
    method: "POST",
  });
  if (response.ok) return;
  const body = (await response.json()) as { error?: string };
  throw new Error(body.error ?? "Could not leave the workspace");
}
