export const PERSONAL_SPACE_ID = "personal";

const WORKSPACE_NAME_MAX = 80;

export interface LibrarySpace {
  id: string;
  label: string;
}

export interface NamedWorkspace {
  id: string;
  name: string;
}

export interface WorkspaceMember {
  workspaceId: string;
  userId: string;
}

export function librarySpaces(created: readonly NamedWorkspace[] = []): LibrarySpace[] {
  return [
    { id: PERSONAL_SPACE_ID, label: "Personal space" },
    ...created
      .filter((workspace) => workspace.id !== PERSONAL_SPACE_ID)
      .map((workspace) => ({ id: workspace.id, label: workspace.name })),
  ];
}

export function workspaceName(input: string) {
  const name = input.trim();
  if (!name) throw new Error("Name the workspace");
  if (name.length > WORKSPACE_NAME_MAX) throw new Error("Name is too long");
  return name;
}

export function firstMember(workspaceId: string, userId: string): WorkspaceMember {
  if (workspaceId === PERSONAL_SPACE_ID) {
    throw new Error("Personal space cannot receive members");
  }
  if (!workspaceId || !userId) {
    throw new Error("A workspace member needs a workspace and an account");
  }
  return { workspaceId, userId };
}

export function documentsInSpace<Document>(
  workspaceId: string,
  documents: readonly Document[],
  created: readonly NamedWorkspace[] = [],
): readonly Document[] {
  const spaces = librarySpaces(created);
  const selected = spaces.find((space) => space.id === workspaceId) ?? spaces[0];
  if (selected?.id === PERSONAL_SPACE_ID) return documents;
  return documents;
}
