import {
  deleteDocument,
  presentDocumentWrite,
  requireLibraryUser,
  updateDocumentContent,
  getEditableDocument,
} from "@/lib/documents";
import { documentUpdateSchema } from "@/lib/document-write";
import { errorResponse, json, readJson } from "@/lib/http";
import type { DocumentType } from "@/lib/content";
import { readDiagram } from "@/lib/content";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const user = await requireLibraryUser();
    const { id } = await context.params;
    const document = await getEditableDocument(user.id, id);
    if (!document) return json({ error: "Document not found" }, 404);
    const type = document.type as DocumentType;
    return json({
      id: document.id,
      type,
      title: document.title,
      version: document.version,
      updatedAt: document.updatedAt,
      content: type === "diagram" ? readDiagram(document.content) : document.content,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const user = await requireLibraryUser();
    const { id } = await context.params;
    const input = documentUpdateSchema.parse(await readJson(request));
    const document = await updateDocumentContent(user.id, id, {
      title: input.title,
      content: input.content,
      patch: input.patch,
    });
    return json(presentDocumentWrite(document));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const user = await requireLibraryUser();
    const { id } = await context.params;
    await deleteDocument(user.id, id);
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
