import {
  and,
  asc,
  count,
  cosineDistance,
  eq,
  exists,
  ilike,
  inArray,
  isNull,
  or,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db";
import {
  agentTokens,
  documentEmbeddings,
  documentShares,
  documents,
  user,
  workspaceMembers,
} from "@/db/schema";
import type { Visibility } from "@/lib/access";
import { normalizeEmails } from "@/lib/access";
import { defaultTitle, documentText, readDiagram, type DocumentType } from "@/lib/content";
import type { DiagramPatch } from "@/lib/diagram-patch";
import { embedText, excerpt } from "@/lib/embeddings";
import {
  applyDocumentWrite,
  DOCUMENT_VERSION_CONFLICT,
  documentVersionConflict,
} from "@/lib/document-write";
import { HttpError } from "@/lib/http";
import {
  documentsInSpace,
  isWorkspaceAdmin,
  PERSONAL_SPACE_ID,
  workspaceLibraryId,
} from "@/lib/library-spaces";
import { currentPlan, currentWorkspacePlan, documentRoom } from "@/lib/plans";
import { hashPassword } from "@/lib/passwords";
import { agentTokenStatus, createAgentToken, hashAgentToken } from "@/lib/tokens";
import { listMemberWorkspaces } from "@/lib/workspaces";

export type AgentScope = {
  allScopes: boolean;
  workspaceIds: string[];
};

export type TokenScopeInput = { all: true } | { all: false; workspaceIds: string[] };

export async function listDocuments(ownerId: string) {
  return getDb()
    .select()
    .from(documents)
    .where(eq(documents.ownerId, ownerId))
    .orderBy(asc(documents.sortIndex), asc(documents.createdAt));
}

function agentDocumentWhere(userId: string, scope: AgentScope) {
  if (scope.allScopes) return accountDocumentWhere(userId);
  return selectedDocumentWhere(userId, scope.workspaceIds);
}

function selectedDocumentWhere(userId: string, workspaceIds: readonly string[]) {
  const personal = workspaceIds.includes(PERSONAL_SPACE_ID);
  const selected = workspaceIds.filter((id) => id !== PERSONAL_SPACE_ID);
  const personalWhere = and(eq(documents.ownerId, userId), isNull(documents.workspaceId));
  const workspaceWhere =
    selected.length === 0
      ? null
      : and(
          inArray(documents.workspaceId, selected),
          exists(
            getDb()
              .select({ id: workspaceMembers.id })
              .from(workspaceMembers)
              .where(
                and(
                  eq(workspaceMembers.workspaceId, documents.workspaceId),
                  eq(workspaceMembers.userId, userId),
                  inArray(workspaceMembers.workspaceId, selected),
                ),
              ),
          ),
        );
  if (personal && workspaceWhere) return or(personalWhere, workspaceWhere);
  if (personal) return personalWhere;
  if (workspaceWhere) return workspaceWhere;
  return sql`false`;
}

export async function listAgentDocuments(userId: string, scope: AgentScope) {
  return getDb()
    .select()
    .from(documents)
    .where(agentDocumentWhere(userId, scope))
    .orderBy(asc(documents.sortIndex), asc(documents.createdAt));
}

const PERSONAL_SPACE_NAME = "Personal space";

export async function listAgentWorkspaces(userId: string, scope: AgentScope) {
  const memberships = await listMemberWorkspaces(userId);
  const members = memberships
    .filter((workspace) => workspace.id !== PERSONAL_SPACE_ID)
    .map((workspace) => ({ id: workspace.id, name: workspace.name }));
  const personal = { id: PERSONAL_SPACE_ID, name: PERSONAL_SPACE_NAME };
  if (scope.allScopes) return [personal, ...members];
  const selected = new Set(scope.workspaceIds);
  const reachable = members.filter((workspace) => selected.has(workspace.id));
  if (!selected.has(PERSONAL_SPACE_ID)) return reachable;
  return [personal, ...reachable];
}

export async function agentCreateWorkspace(userId: string, scope: AgentScope) {
  if (scope.allScopes || scope.workspaceIds.includes(PERSONAL_SPACE_ID)) {
    return PERSONAL_SPACE_ID;
  }
  const selected = scope.workspaceIds.filter((id) => id !== PERSONAL_SPACE_ID);
  if (selected.length === 1) return selected[0];
  const memberships = await listMemberWorkspaces(userId);
  const memberIds = new Set(memberships.map((workspace) => workspace.id));
  const first = selected.find((id) => memberIds.has(id));
  if (!first) throw new HttpError(404, "Workspace not found");
  return first;
}

export async function listLibraryDocuments(ownerId: string) {
  const rows = await listDocuments(ownerId);
  const ids = rows.map((row) => row.id);
  const shares = ids.length
    ? await getDb().select().from(documentShares).where(inArray(documentShares.documentId, ids))
    : [];
  const emails = new Map<string, string[]>();
  for (const share of shares) {
    const current = emails.get(share.documentId) ?? [];
    current.push(share.email);
    emails.set(share.documentId, current);
  }
  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    content: row.content,
    visibility: row.visibility,
    updatedAt: row.updatedAt.toISOString(),
    version: row.version,
    hasPassword: Boolean(row.passwordHash),
    emails: emails.get(row.id) ?? [],
    workspaceId: row.workspaceId,
  }));
}

function createdLibraryId(workspaceId: string) {
  try {
    return workspaceLibraryId(workspaceId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "A document library needs a created workspace";
    throw new HttpError(400, message);
  }
}

async function memberLibraryId(ownerId: string, workspaceId: string) {
  const libraryId = createdLibraryId(workspaceId);
  const [member] = await getDb()
    .select({ workspaceId: workspaceMembers.workspaceId })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, libraryId), eq(workspaceMembers.userId, ownerId)));
  if (!member) throw new HttpError(404, "Workspace not found");
  return libraryId;
}

export async function placeDocumentInWorkspace(
  ownerId: string,
  documentId: string,
  workspaceId: string,
) {
  const libraryId = await memberLibraryId(ownerId, workspaceId);
  const db = getDb();
  const [current] = await db
    .select({ id: documents.id, workspaceId: documents.workspaceId })
    .from(documents)
    .where(and(eq(documents.id, documentId), eq(documents.ownerId, ownerId)));
  if (!current) throw new HttpError(404, "Document not found");
  if (current.workspaceId !== libraryId) {
    const [tally] = await db
      .select({ total: count() })
      .from(documents)
      .where(eq(documents.workspaceId, libraryId));
    const room = documentRoom(Number(tally?.total ?? 0), currentWorkspacePlan());
    if (room) throw new HttpError(403, room);
  }
  const [updated] = await db
    .update(documents)
    .set({ workspaceId: libraryId })
    .where(and(eq(documents.id, documentId), eq(documents.ownerId, ownerId)))
    .returning({ id: documents.id, workspaceId: documents.workspaceId });
  if (!updated?.workspaceId) throw new HttpError(404, "Document not found");
  return { id: updated.id, workspaceId: updated.workspaceId };
}

export async function listSpaceDocuments(ownerId: string, workspaceId: string) {
  const rows = await listLibraryDocuments(ownerId);
  if (workspaceId === PERSONAL_SPACE_ID) return documentsInSpace(PERSONAL_SPACE_ID, rows);
  const libraryId = await memberLibraryId(ownerId, workspaceId);
  return documentsInSpace(libraryId, rows, [{ id: libraryId, name: "Workspace" }]);
}

export async function createDocument(
  ownerId: string,
  type: DocumentType,
  title?: string,
  workspaceId?: string,
) {
  const libraryId =
    !workspaceId || workspaceId === PERSONAL_SPACE_ID
      ? null
      : await memberLibraryId(ownerId, workspaceId);
  const db = getDb();
  const existing = await listDocuments(ownerId);
  if (libraryId) {
    const [tally] = await db
      .select({ total: count() })
      .from(documents)
      .where(eq(documents.workspaceId, libraryId));
    const room = documentRoom(Number(tally?.total ?? 0), currentWorkspacePlan());
    if (room) throw new HttpError(403, room);
  } else {
    const personal = existing.filter((document) => !document.workspaceId);
    const room = documentRoom(personal.length, currentPlan());
    if (room) throw new HttpError(403, room);
  }
  const id = crypto.randomUUID();
  const content = type === "note" ? "" : JSON.stringify({ nodes: [], relations: [] });
  const nextTitle = title?.trim() || defaultTitle(type);
  const [created] = await db
    .insert(documents)
    .values({
      id,
      ownerId,
      type,
      title: nextTitle,
      content,
      version: 1,
      sortIndex: existing.length,
      workspaceId: libraryId ?? null,
    })
    .returning();
  await upsertEmbedding(created);
  return created;
}

export async function getOwnedDocument(ownerId: string, id: string) {
  const [document] = await getDb()
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), eq(documents.ownerId, ownerId)));
  return document ?? null;
}

export async function getAgentDocument(userId: string, id: string, scope: AgentScope) {
  const [document] = await getDb()
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), agentDocumentWhere(userId, scope)));
  return document ?? null;
}

export async function isDocumentWorkspaceMember(userId: string, workspaceId: string | null) {
  if (!workspaceId) return false;
  const [member] = await getDb()
    .select({ id: workspaceMembers.id })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)));
  return Boolean(member);
}

export async function getEditableDocument(userId: string, id: string) {
  const [document] = await getDb().select().from(documents).where(eq(documents.id, id));
  if (!document) return null;
  if (document.ownerId === userId) return document;
  if (await isDocumentWorkspaceMember(userId, document.workspaceId)) return document;
  return null;
}

export async function getDocumentBundle(id: string) {
  const db = getDb();
  const [document] = await db.select().from(documents).where(eq(documents.id, id));
  if (!document) return null;
  const shares = await db.select().from(documentShares).where(eq(documentShares.documentId, id));
  return { document, emails: shares.map((share) => share.email) };
}

export async function updateDocumentContent(
  userId: string,
  id: string,
  input: {
    title?: string;
    content?: unknown;
    patch?: DiagramPatch;
    expectedVersion?: number;
  },
  scope?: AgentScope,
) {
  const db = getDb();
  const updated = await db.transaction(async (tx) => {
    const [current] = await tx.select().from(documents).where(eq(documents.id, id)).for("update");
    if (!current) throw new HttpError(404, "Document not found");
    const workspaceMember = await isDocumentWorkspaceMember(userId, current.workspaceId);
    if (current.ownerId !== userId && !workspaceMember) {
      throw new HttpError(404, "Document not found");
    }
    if (scope && !documentInTokenScope(current, userId, scope, workspaceMember)) {
      throw new HttpError(404, "Document not found");
    }
    const conflict = documentVersionConflict(current.version, input.expectedVersion);
    if (conflict !== null) {
      throw new HttpError(
        409,
        DOCUMENT_VERSION_CONFLICT,
        presentDocumentWrite({
          type: current.type,
          title: current.title,
          content: current.content,
          version: current.version,
        }),
      );
    }
    const title = input.title?.trim() || current.title;
    if (title.length > 160) throw new HttpError(400, "Title is too long");
    let written;
    try {
      written = applyDocumentWrite(
        {
          type: current.type as DocumentType,
          content: current.content,
          version: current.version,
        },
        { content: input.content, patch: input.patch },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid content";
      throw new HttpError(400, message);
    }
    const [row] = await tx
      .update(documents)
      .set({
        title,
        content: written.content,
        version: written.version,
        updatedAt: new Date(),
      })
      .where(eq(documents.id, id))
      .returning();
    return row;
  });
  await upsertEmbedding(updated);
  return updated;
}

function documentInTokenScope(
  document: { ownerId: string; workspaceId: string | null },
  userId: string,
  scope: AgentScope,
  workspaceMember: boolean,
) {
  if (scope.allScopes) {
    if (!document.workspaceId) return document.ownerId === userId;
    return workspaceMember;
  }
  if (!document.workspaceId) {
    return scope.workspaceIds.includes(PERSONAL_SPACE_ID) && document.ownerId === userId;
  }
  return scope.workspaceIds.includes(document.workspaceId) && workspaceMember;
}

export async function deleteDocument(ownerId: string, id: string) {
  const current = await getOwnedDocument(ownerId, id);
  if (!current) throw new HttpError(404, "Document not found");
  await getDb().delete(documents).where(eq(documents.id, id));
}

export async function reorderDocuments(ownerId: string, ids: string[]) {
  const owned = await listDocuments(ownerId);
  const ownedIds = new Set(owned.map((document) => document.id));
  if (ids.length !== owned.length || ids.some((id) => !ownedIds.has(id))) {
    throw new HttpError(400, "Reorder must include every document");
  }
  const db = getDb();
  await Promise.all(
    ids.map((id, index) =>
      db.update(documents).set({ sortIndex: index }).where(eq(documents.id, id)),
    ),
  );
}

async function adminLibraryId(ownerId: string, workspaceId: string) {
  const libraryId = createdLibraryId(workspaceId);
  const [member] = await getDb()
    .select({ role: workspaceMembers.role })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, libraryId), eq(workspaceMembers.userId, ownerId)));
  if (!isWorkspaceAdmin(member?.role)) {
    throw new HttpError(403, "Only an admin can choose this workspace");
  }
  return libraryId;
}

async function applyDocumentWorkspace(
  ownerId: string,
  documentId: string,
  currentWorkspaceId: string | null,
  workspaceId: string | null,
) {
  if (workspaceId === currentWorkspaceId) return currentWorkspaceId;
  if (currentWorkspaceId) await adminLibraryId(ownerId, currentWorkspaceId);
  if (workspaceId === null) {
    const [updated] = await getDb()
      .update(documents)
      .set({ workspaceId: null })
      .where(and(eq(documents.id, documentId), eq(documents.ownerId, ownerId)))
      .returning({ id: documents.id });
    if (!updated) throw new HttpError(404, "Document not found");
    return null;
  }
  await adminLibraryId(ownerId, workspaceId);
  const placed = await placeDocumentInWorkspace(ownerId, documentId, workspaceId);
  return placed.workspaceId;
}

export async function updateShare(
  ownerId: string,
  id: string,
  input: {
    visibility: Visibility;
    password?: string;
    emails?: string[];
    workspaceId?: string | null;
  },
) {
  const current = await getOwnedDocument(ownerId, id);
  if (!current) throw new HttpError(404, "Document not found");
  const emails = input.visibility === "emails" ? normalizeEmails(input.emails ?? []) : [];
  if (input.visibility === "emails" && emails.length === 0) {
    throw new HttpError(400, "Add at least one email address");
  }
  let passwordHash = current.passwordHash;
  if (input.visibility === "password") {
    if (input.password) {
      if (input.password.length < 4)
        throw new HttpError(400, "Password must be at least 4 characters");
      passwordHash = hashPassword(input.password);
    } else if (!passwordHash) {
      throw new HttpError(400, "Set a password for this link");
    }
  }

  const workspaceId =
    input.workspaceId === undefined
      ? current.workspaceId
      : await applyDocumentWorkspace(ownerId, id, current.workspaceId, input.workspaceId);

  const db = getDb();
  await db
    .update(documents)
    .set({ visibility: input.visibility, passwordHash, updatedAt: new Date() })
    .where(eq(documents.id, id));
  await db.delete(documentShares).where(eq(documentShares.documentId, id));
  if (emails.length) {
    await db.insert(documentShares).values(
      emails.map((email) => ({
        id: crypto.randomUUID(),
        documentId: id,
        email,
      })),
    );
  }
  return {
    visibility: input.visibility,
    emails,
    hasPassword: Boolean(passwordHash),
    workspaceId,
  };
}

async function upsertEmbedding(document: {
  id: string;
  type: string;
  title: string;
  content: string;
}) {
  const embedding = embedText(
    documentText(document.type as DocumentType, document.title, document.content),
  );
  await getDb()
    .insert(documentEmbeddings)
    .values({ documentId: document.id, embedding, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: documentEmbeddings.documentId,
      set: { embedding, updatedAt: new Date() },
    });
}

function accountDocumentWhere(userId: string) {
  const membership = getDb()
    .select({ id: workspaceMembers.id })
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, documents.workspaceId),
        eq(workspaceMembers.userId, userId),
      ),
    );
  return or(and(eq(documents.ownerId, userId), isNull(documents.workspaceId)), exists(membership));
}

async function searchVisibleDocuments(
  query: string,
  limit: number,
  visible: ReturnType<typeof agentDocumentWhere>,
) {
  const db = getDb();
  const embedding = embedText(query);
  try {
    const distance = cosineDistance(documentEmbeddings.embedding, embedding);
    const rows = await db
      .select({
        id: documents.id,
        type: documents.type,
        title: documents.title,
        content: documents.content,
        version: documents.version,
        updatedAt: documents.updatedAt,
        distance,
      })
      .from(documentEmbeddings)
      .innerJoin(documents, eq(documents.id, documentEmbeddings.documentId))
      .where(visible)
      .orderBy(distance)
      .limit(limit);
    return rows.map((row) => ({
      ...row,
      score: 1 - Number(row.distance),
    }));
  } catch (error) {
    console.error("Embedding search failed, falling back to text search", error);
    const pattern = `%${query.replace(/[%_\\]/g, "")}%`;
    const rows = await db
      .select()
      .from(documents)
      .where(and(visible, or(ilike(documents.title, pattern), ilike(documents.content, pattern))))
      .limit(limit);
    return rows.map((row) => ({ ...row, score: 0, distance: null }));
  }
}

export async function searchDocuments(
  userId: string,
  query: string,
  limit: number,
  scope: AgentScope,
) {
  if (scope.allScopes) return searchAccountDocuments(userId, query, limit);
  return searchVisibleDocuments(query, limit, agentDocumentWhere(userId, scope));
}

export async function searchAccountDocuments(userId: string, query: string, limit: number) {
  return searchVisibleDocuments(query, limit, accountDocumentWhere(userId));
}

export function presentDocument(
  document: {
    id: string;
    type: string;
    title: string;
    content: string;
    version: number;
    updatedAt: Date;
  },
  origin: string,
) {
  const type = document.type as DocumentType;
  const text = documentText(type, document.title, document.content);
  return {
    id: document.id,
    type,
    title: document.title,
    url: `${origin}/d/${document.id}`,
    updatedAt: document.updatedAt,
    version: document.version,
    content: type === "diagram" ? readDiagram(document.content) : document.content,
    text,
    excerpt: excerpt(text),
  };
}

export function presentDocumentWrite(document: {
  type: string;
  title: string;
  content: string;
  version: number;
}) {
  const type = document.type as DocumentType;
  return {
    version: document.version,
    title: document.title,
    content: type === "diagram" ? readDiagram(document.content) : document.content,
  };
}

export const PAMIAC_TOKEN_COOKIE = "pamiac_token";

export async function authenticateAgentToken(token: string) {
  const value = token.trim();
  if (!value.startsWith("pam_")) return { status: "missing" as const };
  const tokenHash = hashAgentToken(value);
  const [row] = await getDb()
    .select({
      id: agentTokens.id,
      userId: agentTokens.userId,
      email: user.email,
      tokenHash: agentTokens.tokenHash,
      expiresAt: agentTokens.expiresAt,
      revokedAt: agentTokens.revokedAt,
      allScopes: agentTokens.allScopes,
      workspaceIds: agentTokens.workspaceIds,
    })
    .from(agentTokens)
    .innerJoin(user, eq(user.id, agentTokens.userId))
    .where(and(eq(agentTokens.tokenHash, tokenHash), isNull(agentTokens.revokedAt)));
  const status = agentTokenStatus(value, row ?? null);
  if (status !== "ok") return { status };
  if (!row) return { status: "invalid" as const };
  await getDb()
    .update(agentTokens)
    .set({ lastUsedAt: new Date() })
    .where(eq(agentTokens.id, row.id));
  return {
    status: "ok" as const,
    user: {
      id: row.userId,
      email: row.email,
      scope: scopeFromRow(row),
    },
  };
}

export async function requireAgentUser(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
  const result = await authenticateAgentToken(token);
  if (result.status === "ok") {
    return { id: result.user.id, scope: result.user.scope };
  }
  if (result.status === "expired") throw new HttpError(401, "Expired agent token");
  if (result.status === "invalid") throw new HttpError(401, "Invalid agent token");
  throw new HttpError(401, "Missing agent token");
}

export async function agentUserFromCookie() {
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  const token = jar.get(PAMIAC_TOKEN_COOKIE)?.value ?? "";
  const result = await authenticateAgentToken(token);
  if (result.status !== "ok") return null;
  return result.user;
}

export async function listTokens(userId: string) {
  return getDb()
    .select({
      id: agentTokens.id,
      name: agentTokens.name,
      tokenPrefix: agentTokens.tokenPrefix,
      secret: agentTokens.secret,
      createdAt: agentTokens.createdAt,
      lastUsedAt: agentTokens.lastUsedAt,
      expiresAt: agentTokens.expiresAt,
      revokedAt: agentTokens.revokedAt,
      allScopes: agentTokens.allScopes,
      workspaceIds: agentTokens.workspaceIds,
    })
    .from(agentTokens)
    .where(eq(agentTokens.userId, userId))
    .orderBy(asc(agentTokens.createdAt));
}

function scopeFromRow(row: { allScopes: boolean; workspaceIds: string[] | null }): AgentScope {
  if (row.allScopes) return { allScopes: true, workspaceIds: [] };
  return { allScopes: false, workspaceIds: row.workspaceIds ?? [] };
}

async function resolveTokenScope(userId: string, scope: TokenScopeInput) {
  if (scope.all) return { allScopes: true, workspaceIds: [] as string[] };
  const workspaceIds = uniqueScopeIds(scope.workspaceIds);
  if (workspaceIds.length === 0) throw new HttpError(400, "Choose at least one space");
  const selected = workspaceIds.filter((id) => id !== PERSONAL_SPACE_ID);
  if (selected.length === 0) return { allScopes: false, workspaceIds };
  const memberships = await listMemberWorkspaces(userId);
  const memberIds = new Set(memberships.map((workspace) => workspace.id));
  if (selected.some((id) => !memberIds.has(id))) {
    throw new HttpError(404, "Workspace not found");
  }
  return { allScopes: false, workspaceIds };
}

function uniqueScopeIds(ids: readonly string[]) {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const id of ids) {
    const value = id.trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    unique.push(value);
  }
  return unique;
}

function tokenName(name: string) {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 80) throw new HttpError(400, "Give the token a name");
  return trimmed;
}

export async function issueToken(
  userId: string,
  name: string,
  expiresAt: Date | null,
  scope: TokenScopeInput,
) {
  const trimmed = tokenName(name);
  const stored = await resolveTokenScope(userId, scope);
  const created = createAgentToken();
  const id = crypto.randomUUID();
  await getDb().insert(agentTokens).values({
    id,
    userId,
    name: trimmed,
    tokenHash: created.tokenHash,
    tokenPrefix: created.tokenPrefix,
    secret: created.token,
    expiresAt,
    allScopes: stored.allScopes,
    workspaceIds: stored.workspaceIds,
  });
  return { id, name: trimmed, token: created.token, tokenPrefix: created.tokenPrefix };
}

export async function updateToken(
  userId: string,
  id: string,
  name: string | undefined,
  scope: TokenScopeInput,
) {
  const stored = await resolveTokenScope(userId, scope);
  const changes: { name?: string; allScopes: boolean; workspaceIds: string[] } = {
    allScopes: stored.allScopes,
    workspaceIds: stored.workspaceIds,
  };
  if (name !== undefined) changes.name = tokenName(name);
  const [row] = await getDb()
    .update(agentTokens)
    .set(changes)
    .where(
      and(eq(agentTokens.id, id), eq(agentTokens.userId, userId), isNull(agentTokens.revokedAt)),
    )
    .returning({ id: agentTokens.id });
  if (!row) throw new HttpError(404, "Token not found");
}

export async function revokeToken(userId: string, id: string) {
  const [row] = await getDb()
    .update(agentTokens)
    .set({ revokedAt: new Date() })
    .where(
      and(eq(agentTokens.id, id), eq(agentTokens.userId, userId), isNull(agentTokens.revokedAt)),
    )
    .returning({ id: agentTokens.id });
  if (!row) throw new HttpError(404, "Token not found");
}

export async function requireUserId() {
  const { getSession } = await import("@/lib/session");
  const result = await getSession();
  if (result.status !== "ok" || !result.session) throw new HttpError(401, "Sign in required");
  return result.session.user;
}

export async function requireLibraryUser() {
  const { getLibrarySession } = await import("@/lib/session");
  const result = await getLibrarySession();
  if (result.status !== "ok" || !result.session) throw new HttpError(401, "Sign in required");
  return result.session.user;
}
