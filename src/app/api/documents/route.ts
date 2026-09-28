import { z } from "zod";
import { createDocument, listDocuments, reorderDocuments, requireUserId } from "@/lib/documents";
import { errorResponse, json, readJson } from "@/lib/http";

const createSchema = z.object({
  type: z.enum(["note", "diagram"]),
  title: z.string().max(160).optional(),
});

export async function GET() {
  try {
    const user = await requireUserId();
    const rows = await listDocuments(user.id);
    return json({ documents: rows });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUserId();
    const input = createSchema.parse(await readJson(request));
    const document = await createDocument(user.id, input.type, input.title);
    return json({ id: document.id }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}

const reorderSchema = z.object({ ids: z.array(z.string()).max(500) });

export async function PUT(request: Request) {
  try {
    const user = await requireUserId();
    const input = reorderSchema.parse(await readJson(request));
    await reorderDocuments(user.id, input.ids);
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
