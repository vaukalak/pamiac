import { defaultTitle } from "./content.ts";
import { PERSONAL_SPACE_ID } from "./library-spaces.ts";

export function importNoteTitle(title: string) {
  return title.trim() || defaultTitle("note");
}

async function readError(response: Response) {
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  return body?.error ?? "Could not import this note.";
}

export async function importSharedNote(title: string, content: string, workspaceId: string) {
  const payload: { type: "note"; title: string; workspaceId?: string } = {
    type: "note",
    title: importNoteTitle(title),
  };
  if (workspaceId && workspaceId !== PERSONAL_SPACE_ID) {
    payload.workspaceId = workspaceId;
  }
  const created = await fetch("/api/documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => null);
  if (!created) throw new Error("Could not import this note.");
  const createdBody = (await created.json().catch(() => null)) as {
    id?: string;
    error?: string;
  } | null;
  if (!created.ok || !createdBody?.id) {
    throw new Error(createdBody?.error ?? "Could not import this note.");
  }
  const saved = await fetch(`/api/documents/${createdBody.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, version: 1 }),
  }).catch(() => null);
  if (!saved || !saved.ok) {
    await fetch(`/api/documents/${createdBody.id}`, { method: "DELETE" }).catch(() => null);
    throw new Error(saved ? await readError(saved) : "Could not import this note.");
  }
  return createdBody.id;
}
