import { PERSONAL_SPACE_ID } from "./library-spaces.ts";

const FOLDER_NAME_MAX = 80;

export type FolderRecord = {
  id: string;
  name: string;
  parentId: string | null;
  workspaceId: string | null;
  sortIndex: number;
};

export function folderName(input: string) {
  const name = input.trim();
  if (!name) throw new Error("Name the folder");
  if (Array.from(name).length > FOLDER_NAME_MAX) throw new Error("Name is too long");
  return name;
}

export function folderInAgentScope(
  scope: { allScopes: boolean; workspaceIds: readonly string[] },
  workspaceId: string | null,
) {
  if (scope.allScopes) return true;
  return scope.workspaceIds.includes(workspaceId ?? PERSONAL_SPACE_ID);
}

export function libraryWorkspaceId(workspaceId: string) {
  if (!workspaceId || workspaceId === PERSONAL_SPACE_ID) return null;
  return workspaceId;
}

export function folderStorageKey(workspaceId: string) {
  return `pamiac-open-folder:${workspaceId}`;
}

export function documentsInFolder<Document extends { folderId?: string | null }>(
  documents: readonly Document[],
  folderId: string | null,
) {
  return documents.filter((document) => (document.folderId ?? null) === folderId);
}

export function childFolders(
  folders: readonly FolderRecord[],
  workspaceId: string,
  parentId: string | null,
) {
  const libraryId = libraryWorkspaceId(workspaceId);
  return folders
    .filter(
      (folder) =>
        (folder.workspaceId ?? null) === libraryId && (folder.parentId ?? null) === parentId,
    )
    .sort((left, right) => left.sortIndex - right.sortIndex || left.name.localeCompare(right.name));
}

export function folderMovesIntoItself(
  folders: readonly { id: string; parentId: string | null }[],
  folderId: string,
  parentId: string | null,
) {
  if (!parentId) return false;
  const parents = new Map(folders.map((folder) => [folder.id, folder.parentId]));
  const seen = new Set<string>();
  let current: string | null = parentId;
  while (current) {
    if (current === folderId) return true;
    if (seen.has(current)) return true;
    seen.add(current);
    const parent = parents.get(current);
    current = parent === undefined ? null : parent;
  }
  return false;
}

export function folderTrail(
  folders: readonly FolderRecord[],
  folderId: string | null,
  workspaceId: string | null,
) {
  if (!folderId) return [];
  const byId = new Map(folders.map((folder) => [folder.id, folder]));
  const trail: { id: string; name: string }[] = [];
  const seen = new Set<string>();
  let current = byId.get(folderId) ?? null;
  while (current) {
    if ((current.workspaceId ?? null) !== workspaceId) return [];
    if (seen.has(current.id)) return [];
    seen.add(current.id);
    trail.push({ id: current.id, name: current.name });
    current = current.parentId ? (byId.get(current.parentId) ?? null) : null;
  }
  return trail.reverse();
}
