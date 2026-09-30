import { z } from "zod";
import { requireLibraryUser, requireUserId } from "@/lib/documents";
import { errorResponse, json, readJson } from "@/lib/http";
import { addWorkspacePerson } from "@/lib/workspace-people";
import { listWorkspaceRoster } from "@/lib/workspace-roster";

const addSchema = z.object({
  email: z.string().max(320),
  role: z.string().optional().nullable(),
});

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const user = await requireLibraryUser();
    const { id } = await context.params;
    const roster = await listWorkspaceRoster(user.id, id);
    return json(roster);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request, context: Context) {
  try {
    const user = await requireUserId();
    const { id } = await context.params;
    const input = addSchema.parse(await readJson(request));
    const person = await addWorkspacePerson(user.id, id, input.email, input.role ?? "");
    return json({ person }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
