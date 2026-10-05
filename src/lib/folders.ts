import { and, asc, eq, inArray, isNull, or, type SQL } from "drizzle-orm";
import { getDb } from "@/db";
import { documents, folderShares, folders, user } from "@/db/schema";
import type { Visibility } from "@/lib/access";
import { appBaseUrl } from "@/lib/config";
import {
  agentCreateWorkspace,
  getAgentDocument,
  getEditableDocument,
  type AgentScope,
} from "@/lib/documents";
import {
  folderInAgentScope,
  folderMovesIntoItself,
  folderName,
  libraryWorkspaceId,
  presentSharedFolder,
} from "@/lib/folder-library";
import { captureServerEvent, folderCreatedEvent } from "@/lib/analytics";
import { HttpError } from "@/lib/http";
import { PERSONAL_SPACE_ID } from "@/lib/library-spaces";
import { sendFolderShared } from "@/lib/mail";
import { prepareShareCredentials } from "@/lib/share-update";
import { listMemberWorkspaces } from "@/lib/workspaces";

export type FolderGrant = {
  id: string;
  visibility: Visibility;
  passwordHash: string | null;
  allowedEmails: string[];
};

export async function listLibraryFolders(userId: string) {
  const memberships = await listMemberWorkspaces(userId);
  const workspaceIds = memberships
    .map((workspace) => workspace.id)
    .filter((id) => id !== PERSONAL_SPACE_ID);
  const personal = and(eq(folders.ownerId, userId), isNull(folders.workspaceId));
  const shared = workspaceIds.length > 0 ? inArray(folders.workspaceId, workspaceIds) : null;
  const rows = await selectFolders(shared ? or(personal, shared) : personal);
  return presentLibraryFolders(rows);
}

export async function listAgentFolders(userId: string, scope: AgentScope) {
  const memberships = await listMemberWorkspaces(userId);
  const memberIds = memberships
    .map((workspace) => workspace.id)
    .filter((id) => id !== PERSONAL_SPACE_ID);
  const allowedMembers = scope.allScopes
    ? memberIds
    : memberIds.filter((id) => scope.workspaceIds.includes(id));
  const includePersonal = scope.allScopes || scope.workspaceIds.includes(PERSONAL_SPACE_ID);
  const personal = includePersonal
    ? and(eq(folders.ownerId, userId), isNull(folders.workspaceId))
    : null;
  const shared = allowedMembers.length > 0 ? inArray(folders.workspaceId, allowedMembers) : null;
  const where = personal && shared ? or(personal, shared) : (personal ?? shared);
  if (!where) return [];
  const rows = await selectFolders(where);
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    parentId: row.parentId,
    workspaceId: row.workspaceId,
    visibility: row.visibility as Visibility,
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

export async function createAgentFolder(
  userId: string,
  scope: AgentScope,
  name: string,
  workspaceId: string | undefined,
  parentId: string | null,
) {
  const resolved = workspaceId ?? (await agentCreateWorkspace(userId, scope));
  const libraryId = libraryWorkspaceId(resolved);
  if (!folderInAgentScope(scope, libraryId)) {
    throw new HttpError(404, "Workspace not found");
  }
  if (parentId) {
    const parent = await visibleFolder(userId, parentId);
    if (!folderInAgentScope(scope, parent.workspaceId)) {
      throw new HttpError(404, "Folder not found");
    }
  }
  return createFolder(userId, name, resolved, parentId);
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
  if (created) {
    await captureServerEvent(folderCreatedEvent({ userId, folderId: created.id }));
  }
  return created;
}

export async function moveAgentDocumentToFolder(
  userId: string,
  scope: AgentScope,
  documentId: string,
  folderId: string | null,
) {
  const document = await getAgentDocument(userId, documentId, scope);
  if (!document) throw new HttpError(404, "Document not found");
  if (folderId) {
    const folder = await visibleFolder(userId, folderId);
    if (!folderInAgentScope(scope, folder.workspaceId)) {
      throw new HttpError(404, "Folder not found");
    }
    if ((folder.workspaceId ?? null) !== (document.workspaceId ?? null)) {
      throw new HttpError(400, "That folder is in another library");
    }
  }
  return moveDocumentToFolder(userId, documentId, folderId);
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

export async function moveAgentFolder(
  userId: string,
  scope: AgentScope,
  folderId: string,
  parentId: string | null,
) {
  const folder = await visibleFolder(userId, folderId);
  if (!folderInAgentScope(scope, folder.workspaceId)) {
    throw new HttpError(404, "Folder not found");
  }
  if (parentId) {
    const parent = await visibleFolder(userId, parentId);
    if (!folderInAgentScope(scope, parent.workspaceId)) {
      throw new HttpError(404, "Folder not found");
    }
    if ((parent.workspaceId ?? null) !== (folder.workspaceId ?? null)) {
      throw new HttpError(400, "That folder is in another library");
    }
  }
  return moveFolder(userId, folderId, parentId);
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

export async function getFolderBundle(id: string) {
  const db = getDb();
  const [folder] = await db.select().from(folders).where(eq(folders.id, id));
  if (!folder) return null;
  const shares = await db.select().from(folderShares).where(eq(folderShares.folderId, id));
  return { folder, emails: shares.map((share) => share.email) };
}

export async function folderGrantChain(folderId: string | null): Promise<FolderGrant[]> {
  const grants: FolderGrant[] = [];
  const seen = new Set<string>();
  let current = folderId;
  while (current && !seen.has(current)) {
    seen.add(current);
    const bundle = await getFolderBundle(current);
    if (!bundle) break;
    grants.push({
      id: bundle.folder.id,
      visibility: bundle.folder.visibility as Visibility,
      passwordHash: bundle.folder.passwordHash,
      allowedEmails: bundle.emails,
    });
    current = bundle.folder.parentId;
  }
  return grants;
}

export async function listDirectFolderContents(folderId: string) {
  const db = getDb();
  const childFolders = await db
    .select({ id: folders.id, name: folders.name })
    .from(folders)
    .where(eq(folders.parentId, folderId))
    .orderBy(asc(folders.sortIndex), asc(folders.name));
  const childDocuments = await db
    .select({ id: documents.id, title: documents.title })
    .from(documents)
    .where(eq(documents.folderId, folderId))
    .orderBy(asc(documents.sortIndex), asc(documents.title));
  return { folders: childFolders, documents: childDocuments };
}

export async function updateFolderShare(
  userId: string,
  id: string,
  input: {
    visibility: Visibility;
    password?: string;
    emails?: string[];
  },
  options?: { scope?: AgentScope; origin?: string },
) {
  const folder = await visibleFolder(userId, id);
  if (options?.scope && !folderInAgentScope(options.scope, folder.workspaceId)) {
    throw new HttpError(404, "Folder not found");
  }
  const prepared = prepareShareCredentials({
    visibility: input.visibility,
    password: input.password,
    emails: input.emails,
    currentPasswordHash: folder.passwordHash,
  });
  const emails = prepared.emails;
  const passwordHash = prepared.passwordHash;
  const db = getDb();
  const previousShares = await db
    .select({ email: folderShares.email })
    .from(folderShares)
    .where(eq(folderShares.folderId, id));
  const alreadyShared = new Set(previousShares.map((share) => share.email.toLowerCase()));
  await db
    .update(folders)
    .set({ visibility: input.visibility, passwordHash })
    .where(eq(folders.id, id));
  await db.delete(folderShares).where(eq(folderShares.folderId, id));
  if (emails.length) {
    await db.insert(folderShares).values(
      emails.map((email) => ({
        id: crypto.randomUUID(),
        folderId: id,
        email,
      })),
    );
  }
  const added = emails.filter((email) => !alreadyShared.has(email.toLowerCase()));
  if (added.length) {
    const senderName = await folderSenderLabel(userId);
    const folderUrl = `${appBaseUrl()}/f/${id}`;
    const delivered: string[] = [];
    try {
      for (const email of added) {
        await sendFolderShared({
          email,
          url: folderUrl,
          senderName,
          folderName: folder.name,
          accountRequired: true,
        });
        delivered.push(email);
      }
    } catch (error) {
      const pending = added.filter((email) => !delivered.includes(email));
      if (pending.length) {
        await db
          .delete(folderShares)
          .where(and(eq(folderShares.folderId, id), inArray(folderShares.email, pending)));
      }
      console.error(error);
      throw new HttpError(502, "Could not send the folder email");
    }
  }
  return presentSharedFolder(
    {
      id: folder.id,
      name: folder.name,
      visibility: input.visibility,
      emails,
      hasPassword: Boolean(passwordHash),
    },
    options?.origin ?? "",
  );
}

async function selectFolders(where: SQL | undefined) {
  if (!where) return [];
  return getDb()
    .select()
    .from(folders)
    .where(where)
    .orderBy(asc(folders.sortIndex), asc(folders.createdAt));
}

async function presentLibraryFolders(rows: Awaited<ReturnType<typeof selectFolders>>) {
  const shares = await emailsByFolder(rows.map((row) => row.id));
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    parentId: row.parentId,
    workspaceId: row.workspaceId,
    sortIndex: row.sortIndex,
    visibility: row.visibility as Visibility,
    emails: shares.get(row.id) ?? [],
    hasPassword: Boolean(row.passwordHash),
  }));
}

async function emailsByFolder(ids: string[]) {
  const grouped = new Map<string, string[]>();
  if (ids.length === 0) return grouped;
  const rows = await getDb()
    .select({ folderId: folderShares.folderId, email: folderShares.email })
    .from(folderShares)
    .where(inArray(folderShares.folderId, ids));
  for (const row of rows) {
    const list = grouped.get(row.folderId) ?? [];
    list.push(row.email);
    grouped.set(row.folderId, list);
  }
  return grouped;
}

async function folderSenderLabel(ownerId: string) {
  const [owner] = await getDb()
    .select({ name: user.name, email: user.email })
    .from(user)
    .where(eq(user.id, ownerId));
  const name = owner?.name.replace(/[\r\n]+/g, " ").trim() ?? "";
  if (name) return name;
  const email = owner?.email.replace(/[\r\n]+/g, " ").trim() ?? "";
  return email || "Someone";
}
