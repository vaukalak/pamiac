import { z } from "zod";
import { requireUserId } from "@/lib/documents";
import { errorResponse, json, readJson } from "@/lib/http";
import { deleteWorkspace } from "@/lib/workspace-delete";
import { renameWorkspace } from "@/lib/workspaces";

const renameSchema = z.object({
  name: z.string().max(80),
});

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    const user = await requireUserId();
    const { id } = await context.params;
    const input = renameSchema.parse(await readJson(request));
    const workspace = await renameWorkspace(user.id, id, input.name);
    return json({ workspace });
  } catch (error) {
    return errorResponse(error);
  }
}

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
