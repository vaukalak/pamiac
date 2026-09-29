import { requireUserId } from "@/lib/documents";
import { errorResponse, json } from "@/lib/http";
import { leaveWorkspace } from "@/lib/workspaces";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Context) {
  try {
    const user = await requireUserId();
    const { id } = await context.params;
    await leaveWorkspace(user.id, id);
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
