import type { DiagramContent } from "@/lib/diagram";
import type { DiagramPatch } from "@/lib/diagram-patch";

export type OwnerDocument = {
  id: string;
  type: "note" | "diagram";
  title: string;
  version: number;
  content: DiagramContent | string;
  updatedAt: string;
};

export type SavedDocument = {
  version: number;
  title: string;
  content: DiagramContent | string;
};

export type DocumentSnapshot = {
  title: string;
  version: number;
};

export type DocumentEditPart = "title" | "body";
export type DocumentEditStatus = "clean" | "dirty" | "error";

export function documentVersionKey(id: string) {
  return ["document-version", id] as const;
}

export function documentEditKey(id: string, part: DocumentEditPart) {
  return ["document-edit", id, part] as const;
}

export function documentSaveKey(id: string) {
  return ["document-save", id] as const;
}

export function documentSnapshotKey(id: string) {
  return ["document-snapshot", id] as const;
}

async function readBody<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error("Document request failed");
  return response.json() as Promise<T>;
}

export async function readDocumentVersion(id: string) {
  return readBody<{ version: number }>(await fetch(`/api/documents/${id}/version`));
}

export async function readOwnerDocument(id: string) {
  return readBody<OwnerDocument>(await fetch(`/api/documents/${id}`));
}

export async function saveOwnerDocument(
  id: string,
  body: { title?: string; content?: unknown; patch?: DiagramPatch; version?: number },
) {
  return readBody<SavedDocument>(
    await fetch(`/api/documents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}
