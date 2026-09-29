import { requireUserId } from "@/lib/documents";
import { errorResponse, json } from "@/lib/http";
import { acceptWorkspaceInvite } from "@/lib/workspace-invites";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Context) {
  try {
    const user = await requireUserId();
    const { id } = await context.params;
    const invite = await acceptWorkspaceInvite(user.id, user.email, id);
    return json({ invite });
  } catch (error) {
    return errorResponse(error);
  }
}
