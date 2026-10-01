import { requireUserId } from "@/lib/documents";
import { errorResponse, json } from "@/lib/http";
import { resendWorkspacePending } from "@/lib/workspace-roster";

type Context = { params: Promise<{ id: string; inviteId: string }> };

export async function POST(_request: Request, context: Context) {
  try {
    const user = await requireUserId();
    const { id, inviteId } = await context.params;
    await resendWorkspacePending(user.id, id, inviteId);
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
