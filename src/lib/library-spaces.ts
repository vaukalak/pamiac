import { normalizeEmails } from "./access.ts";

export const PERSONAL_SPACE_ID = "personal";

const WORKSPACE_NAME_MAX = 80;

export interface LibrarySpace {
  id: string;
  label: string;
}

export type WorkspaceRole = "admin" | "editor";

export interface NamedWorkspace {
  id: string;
  name: string;
  role?: WorkspaceRole;
}

export interface WorkspaceMember {
  workspaceId: string;
  userId: string;
}

export function workspaceRole(source: "creator" | "added"): WorkspaceRole {
  if (source === "creator") return "admin";
  return "editor";
}

export function isWorkspaceAdmin(role: string | null | undefined): boolean {
  return role === "admin";
}

export function managesWorkspace(
  workspaceId: string,
  workspaces: readonly NamedWorkspace[],
): boolean {
  if (workspaceId === PERSONAL_SPACE_ID) return false;
  const open = workspaces.find((workspace) => workspace.id === workspaceId);
  return isWorkspaceAdmin(open?.role);
}

export function librarySpaces(created: readonly NamedWorkspace[] = []): LibrarySpace[] {
  return [
    { id: PERSONAL_SPACE_ID, label: "Personal space" },
    ...created
      .filter((workspace) => workspace.id !== PERSONAL_SPACE_ID)
      .map((workspace) => ({ id: workspace.id, label: workspace.name })),
  ];
}

export function spaceInitial(label: string) {
  const visible = Array.from(label).find((character) => character.trim() !== "");
  return (visible ?? "").toLocaleUpperCase("en");
}

export function spaceTip(label: string) {
  const characters = Array.from(label);
  if (characters.length <= 20) return label;
  return `${characters.slice(0, 20).join("")}-`;
}

export function openWorkspaceName(
  workspaceId: string,
  workspaces: readonly NamedWorkspace[] | undefined,
) {
  return workspaces?.find((workspace) => workspace.id === workspaceId)?.name?.trim() ?? "";
}

export function librarySpaceTitle(
  workspaceId: string,
  workspaces: readonly NamedWorkspace[] | undefined,
) {
  if (workspaceId === PERSONAL_SPACE_ID) return "Personal";
  return openWorkspaceName(workspaceId, workspaces) || "Workspace";
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

export type WorkspacePerson =
  | { status: "member"; workspaceId: string; userId: string }
  | { status: "pending"; workspaceId: string; email: string };

export function workspacePerson(
  workspaceId: string,
  email: string,
  accountUserId: string | null,
): WorkspacePerson {
  if (workspaceId === PERSONAL_SPACE_ID) {
    throw new Error("Personal space cannot receive members");
  }
  if (!workspaceId) {
    throw new Error("A workspace member needs a workspace and an account");
  }
  const [address] = normalizeEmails([email]);
  if (!address) throw new Error("Add an email address");
  if (accountUserId) {
    const member = firstMember(workspaceId, accountUserId);
    return { status: "member", workspaceId: member.workspaceId, userId: member.userId };
  }
  return { status: "pending", workspaceId, email: address };
}

export function openLibraryId(
  stored: string | null,
  created: readonly NamedWorkspace[] = [],
): string {
  const spaces = librarySpaces(created);
  if (stored && spaces.some((space) => space.id === stored)) return stored;
  return PERSONAL_SPACE_ID;
}

export function workspaceLibraryId(workspaceId: string) {
  if (!workspaceId || workspaceId === PERSONAL_SPACE_ID) {
    throw new Error("A document library needs a created workspace");
  }
  return workspaceId;
}

export function placeDocument<Document extends { id: string; workspaceId?: string | null }>(
  documents: readonly Document[],
  documentId: string,
  workspaceId: string,
): Document[] {
  const libraryId = workspaceLibraryId(workspaceId);
  if (!documents.some((document) => document.id === documentId)) {
    throw new Error("Document not found");
  }
  return documents.map((document) =>
    document.id === documentId ? { ...document, workspaceId: libraryId } : document,
  );
}

export function documentsInSpace<Document extends { workspaceId?: string | null }>(
  workspaceId: string,
  documents: readonly Document[],
  created: readonly NamedWorkspace[] = [],
): readonly Document[] {
  const spaces = librarySpaces(created);
  const selected = spaces.find((space) => space.id === workspaceId) ?? spaces[0];
  if (!selected || selected.id === PERSONAL_SPACE_ID) return personalDocuments(documents);
  return documents.filter((document) => document.workspaceId === selected.id);
}

function personalDocuments<Document extends { workspaceId?: string | null }>(
  documents: readonly Document[],
): readonly Document[] {
  const personal = documents.filter((document) => !document.workspaceId);
  return personal.length === documents.length ? documents : personal;
}
