import { z } from "zod";
import { requireUserId } from "@/lib/documents";
import { errorResponse, json, readJson } from "@/lib/http";
import { changeWorkspaceMemberRole } from "@/lib/workspace-roster";

const roleSchema = z.object({
  role: z.enum(["admin", "editor"]),
});

type Context = { params: Promise<{ id: string; memberId: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    const user = await requireUserId();
    const { id, memberId } = await context.params;
    const input = roleSchema.parse(await readJson(request));
    await changeWorkspaceMemberRole(user.id, id, memberId, input.role);
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
