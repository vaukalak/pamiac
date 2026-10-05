import { parseNoteNotification } from "@/lib/note-notify";
import { readNoteNotification, saveNoteNotification } from "@/lib/note-notify-run";
import { requireLibraryUser } from "@/lib/documents";
import { errorResponse, json, readJson } from "@/lib/http";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const user = await requireLibraryUser();
    const { id } = await context.params;
    return json(await readNoteNotification(user.id, id));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request, context: Context) {
  try {
    const user = await requireLibraryUser();
    const { id } = await context.params;
    const input = parseNoteNotification(await readJson(request));
    return json(await saveNoteNotification(user.id, id, input));
  } catch (error) {
    return errorResponse(error);
  }
}
