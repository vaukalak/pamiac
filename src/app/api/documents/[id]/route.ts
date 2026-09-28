import { z } from "zod";
import { deleteDocument, requireUserId, updateDocumentContent } from "@/lib/documents";
import { errorResponse, json, readJson } from "@/lib/http";

const updateSchema = z.object({
  title: z.string().max(160).optional(),
  content: z.unknown().optional(),
});

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    const user = await requireUserId();
    const { id } = await context.params;
    const input = updateSchema.parse(await readJson(request));
    const document = await updateDocumentContent(user.id, id, input);
    return json({ id: document.id, updatedAt: document.updatedAt });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const user = await requireUserId();
    const { id } = await context.params;
    await deleteDocument(user.id, id);
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
