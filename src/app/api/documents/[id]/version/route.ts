import { getEditableDocument, requireUserId } from "@/lib/documents";
import { errorResponse, json } from "@/lib/http";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const user = await requireUserId();
    const { id } = await context.params;
    const document = await getEditableDocument(user.id, id);
    if (!document) return json({ error: "Document not found" }, 404);
    return json({ version: document.version });
  } catch (error) {
    return errorResponse(error);
  }
}
