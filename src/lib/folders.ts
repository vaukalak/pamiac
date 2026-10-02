import { and, asc, eq, inArray, isNull, or } from "drizzle-orm";
import { getDb } from "@/db";
import { documents, folders } from "@/db/schema";
import { folderMovesIntoItself, folderName, libraryWorkspaceId } from "@/lib/folder-library";
import { getEditableDocument } from "@/lib/documents";
import { HttpError } from "@/lib/http";
import { PERSONAL_SPACE_ID } from "@/lib/library-spaces";
import { listMemberWorkspaces } from "@/lib/workspaces";

export async function listLibraryFolders(userId: string) {
  const memberships = await listMemberWorkspaces(userId);
  const workspaceIds = memberships
    .map((workspace) => workspace.id)
    .filter((id) => id !== PERSONAL_SPACE_ID);
  const personal = and(eq(folders.ownerId, userId), isNull(folders.workspaceId));
  const shared = workspaceIds.length > 0 ? inArray(folders.workspaceId, workspaceIds) : null;
  const rows = await getDb()
    .select()
    .from(folders)
    .where(shared ? or(personal, shared) : personal)
    .orderBy(asc(folders.sortIndex), asc(folders.createdAt));
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    parentId: row.parentId,
    workspaceId: row.workspaceId,
    sortIndex: row.sortIndex,
  }));
}

async function visibleFolder(userId: string, folderId: string) {
  const [folder] = await getDb().select().from(folders).where(eq(folders.id, folderId));
  if (!folder) throw new HttpError(404, "Folder not found");
  if (!folder.workspaceId) {
    if (folder.ownerId !== userId) throw new HttpError(404, "Folder not found");
    return folder;
  }
  const memberships = await listMemberWorkspaces(userId);
  if (!memberships.some((workspace) => workspace.id === folder.workspaceId)) {
    throw new HttpError(404, "Folder not found");
  }
  return folder;
}

async function libraryIdFor(userId: string, workspaceId: string | undefined) {
  const libraryId = libraryWorkspaceId(workspaceId ?? PERSONAL_SPACE_ID);
  if (!libraryId) return null;
  const memberships = await listMemberWorkspaces(userId);
  if (!memberships.some((workspace) => workspace.id === libraryId)) {
    throw new HttpError(404, "Workspace not found");
  }
  return libraryId;
}

function namedFolder(input: string) {
  try {
    return folderName(input);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Name the folder";
    throw new HttpError(400, message);
  }
}

export async function createFolder(
  userId: string,
  name: string,
  workspaceId: string | undefined,
  parentId: string | null,
) {
  const nextName = namedFolder(name);
  const libraryId = await libraryIdFor(userId, workspaceId);
  if (parentId) {
    const parent = await visibleFolder(userId, parentId);
    if ((parent.workspaceId ?? null) !== libraryId) {
      throw new HttpError(400, "That folder is in another library");
    }
  }
  const db = getDb();
  const siblings = await db
    .select({ id: folders.id })
    .from(folders)
    .where(
      and(
        libraryId
          ? eq(folders.workspaceId, libraryId)
          : and(eq(folders.ownerId, userId), isNull(folders.workspaceId)),
        parentId ? eq(folders.parentId, parentId) : isNull(folders.parentId),
      ),
    );
  const id = crypto.randomUUID();
  const [created] = await db
    .insert(folders)
    .values({
      id,
      ownerId: userId,
      name: nextName,
      workspaceId: libraryId,
      parentId,
      sortIndex: siblings.length,
    })
    .returning({
      id: folders.id,
      name: folders.name,
      parentId: folders.parentId,
      workspaceId: folders.workspaceId,
      sortIndex: folders.sortIndex,
    });
  return created;
}

export async function moveDocumentToFolder(
  userId: string,
  documentId: string,
  folderId: string | null,
) {
  const document = await getEditableDocument(userId, documentId);
  if (!document) throw new HttpError(404, "Document not found");
  if (folderId) {
    const folder = await visibleFolder(userId, folderId);
    if ((folder.workspaceId ?? null) !== (document.workspaceId ?? null)) {
      throw new HttpError(400, "That folder is in another library");
    }
  }
  const [updated] = await getDb()
    .update(documents)
    .set({ folderId })
    .where(eq(documents.id, documentId))
    .returning({ id: documents.id, folderId: documents.folderId });
  if (!updated) throw new HttpError(404, "Document not found");
  return updated;
}

export async function moveFolder(userId: string, folderId: string, parentId: string | null) {
  const folder = await visibleFolder(userId, folderId);
  if (parentId) {
    const parent = await visibleFolder(userId, parentId);
    if ((parent.workspaceId ?? null) !== (folder.workspaceId ?? null)) {
      throw new HttpError(400, "That folder is in another library");
    }
  }
  const family = await getDb()
    .select({ id: folders.id, parentId: folders.parentId })
    .from(folders)
    .where(
      folder.workspaceId
        ? eq(folders.workspaceId, folder.workspaceId)
        : and(eq(folders.ownerId, folder.ownerId), isNull(folders.workspaceId)),
    );
  if (folderMovesIntoItself(family, folder.id, parentId)) {
    throw new HttpError(400, "A folder cannot move into itself");
  }
  const [updated] = await getDb()
    .update(folders)
    .set({ parentId })
    .where(eq(folders.id, folderId))
    .returning({
      id: folders.id,
      name: folders.name,
      parentId: folders.parentId,
      workspaceId: folders.workspaceId,
      sortIndex: folders.sortIndex,
    });
  if (!updated) throw new HttpError(404, "Folder not found");
  return updated;
}
