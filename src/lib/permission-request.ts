import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb } from "@/db";
import { documentPermissionRequests, documentShares, documents, user } from "@/db/schema";
import { resolveAccess, type Visibility } from "@/lib/access";
import { appBaseUrl, appSecret } from "@/lib/config";
import { isDocumentWorkspaceMember } from "@/lib/documents";
import { HttpError } from "@/lib/http";
import { sendDocumentPermissionRequest } from "@/lib/mail";
import { unlockCookieName, unlockMatches } from "@/lib/passwords";

interface Caller {
  userId: string;
  email: string;
}

async function loadClosedDocument(documentId: string, caller: Caller) {
  const db = getDb();
  const [document] = await db
    .select({
      id: documents.id,
      ownerId: documents.ownerId,
      title: documents.title,
      visibility: documents.visibility,
      workspaceId: documents.workspaceId,
      passwordHash: documents.passwordHash,
    })
    .from(documents)
    .where(eq(documents.id, documentId));
  if (!document) throw new HttpError(404, "Document not found");

  const shares = await db
    .select({ email: documentShares.email })
    .from(documentShares)
    .where(eq(documentShares.documentId, documentId));
  const jar = await cookies();
  const passwordOk = document.passwordHash
    ? unlockMatches(
        jar.get(unlockCookieName(documentId))?.value,
        documentId,
        document.passwordHash,
        appSecret(),
      )
    : false;
  const workspaceMember = await isDocumentWorkspaceMember(caller.userId, document.workspaceId);
  const access = resolveAccess({
    isOwner: caller.userId === document.ownerId,
    visibility: document.visibility as Visibility,
    viewerEmail: caller.email || null,
    allowedEmails: shares.map((share) => share.email),
    passwordOk,
    workspaceMember,
  });
  if (access.level !== "none") throw new HttpError(409, "You already have access");
  return document;
}

async function storedRequest(documentId: string, userId: string) {
  const [row] = await getDb()
    .select({ id: documentPermissionRequests.id })
    .from(documentPermissionRequests)
    .where(
      and(
        eq(documentPermissionRequests.documentId, documentId),
        eq(documentPermissionRequests.requesterId, userId),
      ),
    );
  return row ?? null;
}

export async function readDocumentPermissionRequest(caller: Caller, documentId: string) {
  await loadClosedDocument(documentId, caller);
  const row = await storedRequest(documentId, caller.userId);
  return { requested: Boolean(row) };
}

export async function requestDocumentPermission(caller: Caller, documentId: string) {
  const document = await loadClosedDocument(documentId, caller);
  const db = getDb();
  const [owner] = await db
    .select({ email: user.email })
    .from(user)
    .where(eq(user.id, document.ownerId));
  const ownerEmail = owner?.email.trim() ?? "";
  if (!ownerEmail) throw new HttpError(400, "The owner has no email address");

  const requesterEmail = caller.email?.trim() ?? "";
  if (!requesterEmail) throw new HttpError(400, "Your account has no email address");

  const [inserted] = await db
    .insert(documentPermissionRequests)
    .values({
      id: crypto.randomUUID(),
      documentId,
      requesterId: caller.userId,
    })
    .onConflictDoNothing({
      target: [documentPermissionRequests.documentId, documentPermissionRequests.requesterId],
    })
    .returning({ id: documentPermissionRequests.id });
  if (!inserted) return { requested: true as const };

  const [requester] = await db
    .select({ name: user.name })
    .from(user)
    .where(eq(user.id, caller.userId));
  const requesterName = requester?.name.replace(/[\r\n]+/g, " ").trim() || undefined;

  try {
    await sendDocumentPermissionRequest({
      email: ownerEmail,
      requesterEmail,
      requesterName,
      documentTitle: document.title,
      url: `${appBaseUrl()}/d/${documentId}`,
    });
  } catch (error) {
    await db
      .delete(documentPermissionRequests)
      .where(eq(documentPermissionRequests.id, inserted.id));
    console.error(error);
    throw new HttpError(502, "Could not send the request email");
  }

  return { requested: true as const };
}
