import { requireUserId } from "@/lib/documents";
import { errorResponse, json } from "@/lib/http";
import { rejectWorkspaceInvite } from "@/lib/workspace-invites";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Context) {
  try {
    const user = await requireUserId();
    const { id } = await context.params;
    await rejectWorkspaceInvite(user.email, id);
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
