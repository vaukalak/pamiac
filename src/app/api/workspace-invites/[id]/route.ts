import { requireUserId } from "@/lib/documents";
import { errorResponse, json } from "@/lib/http";
import { readWorkspaceInvite } from "@/lib/workspace-invites";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const user = await requireUserId();
    const { id } = await context.params;
    const invite = await readWorkspaceInvite(user.email, id);
    return json({ invite });
  } catch (error) {
    return errorResponse(error);
  }
}
