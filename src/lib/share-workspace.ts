import { isWorkspaceAdmin, type NamedWorkspace } from "./library-spaces.ts";

export function adminWorkspaces(workspaces: readonly NamedWorkspace[]) {
  return workspaces.filter((workspace) => isWorkspaceAdmin(workspace.role));
}

export function shareWorkspaceBody(
  initialId: string | null,
  selectedId: string | null,
  workspaces: readonly NamedWorkspace[],
) {
  const admins = adminWorkspaces(workspaces);
  if (admins.length === 0) return {};
  const selectedIsAdmin =
    selectedId !== null && admins.some((workspace) => workspace.id === selectedId);
  const initialIsAdmin =
    initialId !== null && admins.some((workspace) => workspace.id === initialId);
  if (selectedId === initialId && initialId !== null && !initialIsAdmin) return {};
  if (selectedId === null || selectedIsAdmin) return { workspaceId: selectedId };
  return {};
}
