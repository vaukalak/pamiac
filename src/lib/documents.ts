import { and, asc, count, cosineDistance, eq, ilike, inArray, isNull, or } from "drizzle-orm";
import { getDb } from "@/db";
import {
  agentTokens,
  documentEmbeddings,
  documentShares,
  documents,
  workspaceMembers,
} from "@/db/schema";
import type { Visibility } from "@/lib/access";
import { normalizeEmails } from "@/lib/access";
import { defaultTitle, documentText, readDiagram, type DocumentType } from "@/lib/content";
import type { DiagramPatch } from "@/lib/diagram-patch";
import { embedText, excerpt } from "@/lib/embeddings";
import { applyDocumentWrite } from "@/lib/document-write";
import { HttpError } from "@/lib/http";
import { documentsInSpace, PERSONAL_SPACE_ID, workspaceLibraryId } from "@/lib/library-spaces";
import { currentPlan, currentWorkspacePlan, documentRoom } from "@/lib/plans";
import { hashPassword } from "@/lib/passwords";
import { createAgentToken, hashAgentToken, tokenHashesMatch } from "@/lib/tokens";

export async function listDocuments(ownerId: string) {
  return getDb()
    .select()
    .from(documents)
    .where(eq(documents.ownerId, ownerId))
    .orderBy(asc(documents.sortIndex), asc(documents.createdAt));
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

export async function createDocument(ownerId: string, type: DocumentType, title?: string) {
  const db = getDb();
  const existing = await listDocuments(ownerId);
  const personal = existing.filter((document) => !document.workspaceId);
  const room = documentRoom(personal.length, currentPlan());
  if (room) throw new HttpError(403, room);
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
      workspaceId: null,
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

export async function getDocumentBundle(id: string) {
  const db = getDb();
  const [document] = await db.select().from(documents).where(eq(documents.id, id));
  if (!document) return null;
  const shares = await db.select().from(documentShares).where(eq(documentShares.documentId, id));
  return { document, emails: shares.map((share) => share.email) };
}

export async function updateDocumentContent(
  ownerId: string,
  id: string,
  input: { title?: string; content?: unknown; patch?: DiagramPatch },
) {
  const db = getDb();
  const updated = await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(documents)
      .where(and(eq(documents.id, id), eq(documents.ownerId, ownerId)))
      .for("update");
    if (!current) throw new HttpError(404, "Document not found");
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

export async function updateShare(
  ownerId: string,
  id: string,
  input: { visibility: Visibility; password?: string; emails?: string[] },
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
  return { visibility: input.visibility, emails, hasPassword: Boolean(passwordHash) };
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

export async function searchDocuments(ownerId: string, query: string, limit: number) {
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
      .where(eq(documents.ownerId, ownerId))
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
      .where(
        and(
          eq(documents.ownerId, ownerId),
          or(ilike(documents.title, pattern), ilike(documents.content, pattern)),
        ),
      )
      .limit(limit);
    return rows.map((row) => ({ ...row, score: 0, distance: null }));
  }
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

export async function requireAgentUser(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
  if (!token.startsWith("pam_")) throw new HttpError(401, "Missing agent token");
  const tokenHash = hashAgentToken(token);
  const [row] = await getDb()
    .select()
    .from(agentTokens)
    .where(and(eq(agentTokens.tokenHash, tokenHash), isNull(agentTokens.revokedAt)));
  if (!row || !tokenHashesMatch(row.tokenHash, tokenHash)) {
    throw new HttpError(401, "Invalid agent token");
  }
  if (row.expiresAt && row.expiresAt.getTime() <= Date.now()) {
    throw new HttpError(401, "Expired agent token");
  }
  await getDb()
    .update(agentTokens)
    .set({ lastUsedAt: new Date() })
    .where(eq(agentTokens.id, row.id));
  return row.userId;
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
    })
    .from(agentTokens)
    .where(eq(agentTokens.userId, userId))
    .orderBy(asc(agentTokens.createdAt));
}

export async function issueToken(userId: string, name: string, expiresAt: Date | null) {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 80) throw new HttpError(400, "Give the token a name");
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
  });
  return { id, name: trimmed, token: created.token, tokenPrefix: created.tokenPrefix };
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
