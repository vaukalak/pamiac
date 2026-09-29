import { z } from "zod";
import { requireUserId } from "@/lib/documents";
import { errorResponse, json, readJson } from "@/lib/http";
import { createNamedWorkspace, listMemberWorkspaces } from "@/lib/workspaces";

const createSchema = z.object({
  name: z.string().max(80),
});

export async function GET() {
  try {
    const user = await requireUserId();
    const workspaces = await listMemberWorkspaces(user.id);
    return json({ workspaces });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUserId();
    const input = createSchema.parse(await readJson(request));
    const workspace = await createNamedWorkspace(user.id, input.name);
    return json({ workspace }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
