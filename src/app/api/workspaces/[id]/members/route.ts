import { z } from "zod";
import { requireUserId } from "@/lib/documents";
import { errorResponse, json, readJson } from "@/lib/http";
import { addWorkspacePerson } from "@/lib/workspace-people";

const addSchema = z.object({
  email: z.string().max(320),
});

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  try {
    const user = await requireUserId();
    const { id } = await context.params;
    const input = addSchema.parse(await readJson(request));
    const person = await addWorkspacePerson(user.id, id, input.email);
    return json({ person }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
