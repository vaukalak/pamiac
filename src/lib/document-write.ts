import { z } from "zod";
import { MAX_CONTENT_LENGTH } from "./config.ts";
import { readDiagram, serializeContent, type DocumentType } from "./content.ts";
import { applyDiagramPatch, diagramPatchSchema, type DiagramPatch } from "./diagram-patch.ts";

export const documentUpdateSchema = z.object({
  title: z.string().max(160).optional(),
  content: z.unknown().optional(),
  patch: diagramPatchSchema.optional(),
  version: z.number().int().positive().optional(),
});

export const agentDocumentUpdateSchema = documentUpdateSchema.extend({
  version: z.number().int().positive(),
});

export const DOCUMENT_VERSION_CONFLICT =
  "Document changed. Read it again and send the current version.";

export function documentVersionConflict(
  currentVersion: number,
  expectedVersion: number | undefined,
): number | null {
  if (expectedVersion === undefined || expectedVersion === currentVersion) return null;
  return currentVersion;
}

export function applyDocumentWrite(
  current: { type: DocumentType; content: string; version: number },
  input: { content?: unknown; patch?: DiagramPatch },
): { content: string; version: number } {
  if (input.content !== undefined && input.patch !== undefined) {
    throw new Error("Send content or patch, not both");
  }
  let content = current.content;
  if (input.patch !== undefined) {
    if (current.type !== "diagram") throw new Error("Patch applies to diagrams");
    content = JSON.stringify(applyDiagramPatch(readDiagram(current.content), input.patch));
  } else if (input.content !== undefined) {
    content = serializeContent(current.type, input.content, current.content);
  }
  if (content.length > MAX_CONTENT_LENGTH) throw new Error("Document is too large");
  return { content, version: current.version + 1 };
}
