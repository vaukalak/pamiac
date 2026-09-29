import { requireUserId } from "@/lib/documents";
import { errorResponse, json } from "@/lib/http";
import { deleteWorkspace } from "@/lib/workspace-delete";

type Context = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: Context) {
  try {
    const user = await requireUserId();
    const { id } = await context.params;
    await deleteWorkspace(user.id, id);
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
