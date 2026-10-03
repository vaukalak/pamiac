import { randomBytes } from "node:crypto";
import { HttpError } from "./http.ts";

export const MONTHLY_IMAGE_BYTE_CAP = 50 * 1024 * 1024;

export const IMAGE_TYPE_ERROR = "Use a JPEG, PNG, WebP, or GIF image.";
export const IMAGE_CAP_ERROR = "This month's 50 MB image upload limit is full.";
export const IMAGE_CONFIG_ERROR = "Image storage is not configured.";
export const IMAGE_STORE_ERROR = "Could not store the image.";

const JPEG = { contentType: "image/jpeg", extension: "jpg" } as const;
const PNG = { contentType: "image/png", extension: "png" } as const;
const WEBP = { contentType: "image/webp", extension: "webp" } as const;
const GIF = { contentType: "image/gif", extension: "gif" } as const;

export type ImageKind = typeof JPEG | typeof PNG | typeof WEBP | typeof GIF;

export type ImageUsageRow = {
  userId: string;
  byteSize: number;
  createdAt: Date;
};

export function utcMonthWindow(now: Date) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start, end };
}

export function imageBytesThisMonth(rows: readonly ImageUsageRow[], userId: string, now: Date) {
  const { start, end } = utcMonthWindow(now);
  let total = 0;
  for (const row of rows) {
    if (row.userId !== userId) continue;
    if (row.createdAt < start || row.createdAt >= end) continue;
    total += row.byteSize;
  }
  return total;
}

export function imageUploadFits(usedBytes: number, nextBytes: number) {
  if (!Number.isSafeInteger(usedBytes) || usedBytes < 0) return false;
  if (!Number.isSafeInteger(nextBytes) || nextBytes < 1) return false;
  return usedBytes + nextBytes <= MONTHLY_IMAGE_BYTE_CAP;
}

const MULTIPART_OVERHEAD = 64 * 1024;

export function imageRequestTooLarge(contentLength: string | null) {
  const advertised = Number(contentLength ?? "");
  if (!Number.isFinite(advertised)) return false;
  return advertised > MONTHLY_IMAGE_BYTE_CAP + MULTIPART_OVERHEAD;
}

function startsWith(bytes: Uint8Array, signature: readonly number[]) {
  if (bytes.length < signature.length) return false;
  return signature.every((byte, index) => bytes[index] === byte);
}

function asciiAt(bytes: Uint8Array, offset: number, text: string) {
  if (bytes.length < offset + text.length) return false;
  for (let index = 0; index < text.length; index += 1) {
    if (bytes[offset + index] !== text.charCodeAt(index)) return false;
  }
  return true;
}

export function resolveImageType(bytes: Uint8Array, declared: string): ImageKind | null {
  const sniffed = sniffImage(bytes);
  if (!sniffed) return null;
  const normalized = normalizeDeclared(declared);
  if (
    normalized &&
    normalized !== "application/octet-stream" &&
    normalized !== sniffed.contentType
  ) {
    return null;
  }
  return sniffed;
}

function sniffImage(bytes: Uint8Array): ImageKind | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return JPEG;
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return PNG;
  if (asciiAt(bytes, 0, "GIF87a") || asciiAt(bytes, 0, "GIF89a")) return GIF;
  if (asciiAt(bytes, 0, "RIFF") && asciiAt(bytes, 8, "WEBP")) return WEBP;
  return null;
}

function normalizeDeclared(declared: string) {
  const base = declared.split(";")[0]?.trim().toLowerCase() ?? "";
  if (base === "image/jpg" || base === "image/pjpeg") return "image/jpeg";
  return base;
}

export function imageObjectKey(
  extension: string,
  random: (size: number) => Uint8Array = randomBytes,
) {
  return `${Buffer.from(random(16)).toString("hex")}.${extension}`;
}

export function imagePublicUrl(publicBaseUrl: string, key: string) {
  return `${publicBaseUrl.replace(/\/+$/, "")}/${key}`;
}

export type StoredImage = {
  userId: string;
  documentId: string;
  objectKey: string;
  byteSize: number;
  contentType: string;
};

type AcceptInput = {
  userId: string | null;
  documentId: string | null;
  bytes: Uint8Array;
  declaredType: string;
  usedBytes: number;
  publicBaseUrl: string | null;
  key?: string;
  putObject: (object: { key: string; bytes: Uint8Array; contentType: string }) => Promise<void>;
  record: (row: StoredImage) => Promise<void>;
};

export async function acceptImageUpload(input: AcceptInput) {
  if (!input.userId) throw new HttpError(401, "Sign in required");
  if (!input.documentId) throw new HttpError(404, "Document not found");
  const kind = resolveImageType(input.bytes, input.declaredType);
  if (!kind) throw new HttpError(400, IMAGE_TYPE_ERROR);
  const publicBaseUrl = input.publicBaseUrl?.trim() ?? "";
  if (!publicBaseUrl) throw new HttpError(500, IMAGE_CONFIG_ERROR);
  if (!imageUploadFits(input.usedBytes, input.bytes.byteLength)) {
    throw new HttpError(413, IMAGE_CAP_ERROR);
  }
  const key = input.key ?? imageObjectKey(kind.extension);
  const url = imagePublicUrl(publicBaseUrl, key);
  await input.putObject({ key, bytes: input.bytes, contentType: kind.contentType });
  await input.record({
    userId: input.userId,
    documentId: input.documentId,
    objectKey: key,
    byteSize: input.bytes.byteLength,
    contentType: kind.contentType,
  });
  return { url };
}
