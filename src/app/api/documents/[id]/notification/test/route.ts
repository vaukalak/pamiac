import { parseCriteriaTest } from "@/lib/note-notify";
import { testNoteCriteria } from "@/lib/note-notify-run";
import { requireLibraryUser } from "@/lib/documents";
import { errorResponse, json, readJson } from "@/lib/http";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  try {
    const user = await requireLibraryUser();
    const { id } = await context.params;
    const input = parseCriteriaTest(await readJson(request));
    return json(await testNoteCriteria(user.id, id, input.criteria));
  } catch (error) {
    return errorResponse(error);
  }
}
