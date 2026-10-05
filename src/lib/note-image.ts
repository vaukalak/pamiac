import { randomUUID } from "node:crypto";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { imageUploads } from "@/db/schema";
import {
  getAgentDocument,
  getEditableDocument,
  requireLibraryUser,
  type AgentScope,
} from "@/lib/documents";
import { HttpError } from "@/lib/http";
import { acceptImageUpload, imageBytesThisMonth, utcMonthWindow } from "@/lib/image-upload";
import { putR2Object, readR2Config } from "@/lib/r2";

async function usedImageBytes(
  tx: Pick<ReturnType<typeof getDb>, "select">,
  userId: string,
  now: Date,
) {
  const { start, end } = utcMonthWindow(now);
  const rows = await tx
    .select({
      userId: imageUploads.userId,
      byteSize: imageUploads.byteSize,
      createdAt: imageUploads.createdAt,
    })
    .from(imageUploads)
    .where(
      and(
        eq(imageUploads.userId, userId),
        gte(imageUploads.createdAt, start),
        lt(imageUploads.createdAt, end),
      ),
    );
  return imageBytesThisMonth(rows, userId, now);
}

async function storeNoteImage(
  userId: string,
  documentId: string,
  file: { bytes: Uint8Array; type: string },
) {
  const config = readR2Config();
  const now = new Date();
  return getDb().transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${userId}, 0))`);
    const usedBytes = await usedImageBytes(tx, userId, now);
    return acceptImageUpload({
      userId,
      documentId,
      bytes: file.bytes,
      declaredType: file.type,
      usedBytes,
      publicBaseUrl: config.publicBaseUrl,
      putObject: (object) =>
        putR2Object(config, {
          key: object.key,
          bytes: object.bytes,
          contentType: object.contentType,
          now,
        }),
      record: async (row) => {
        await tx.insert(imageUploads).values({
          id: randomUUID(),
          userId: row.userId,
          documentId: row.documentId,
          objectKey: row.objectKey,
          byteSize: row.byteSize,
          createdAt: now,
        });
      },
    });
  });
}

export async function uploadNoteImage(
  documentId: string,
  file: { bytes: Uint8Array; type: string },
) {
  const user = await requireLibraryUser();
  const document = await getEditableDocument(user.id, documentId);
  if (!document) throw new HttpError(404, "Document not found");
  return storeNoteImage(user.id, document.id, file);
}

export async function uploadAgentNoteImage(
  userId: string,
  documentId: string,
  file: { bytes: Uint8Array; type: string },
  scope: AgentScope,
) {
  const document = await getAgentDocument(userId, documentId, scope);
  if (!document) throw new HttpError(404, "Document not found");
  if (document.type !== "note") throw new HttpError(400, "Images belong on notes.");
  return storeNoteImage(userId, document.id, file);
}
