import { z } from "zod";
import {
  createDocument,
  deleteDocument,
  listLibraryDocuments,
  reorderDocuments,
  requireLibraryUser,
} from "@/lib/documents";
import { moveDocumentToFolder } from "@/lib/folders";
import { errorResponse, json, readJson } from "@/lib/http";

const createSchema = z.object({
  type: z.enum(["note", "diagram"]),
  title: z.string().max(160).optional(),
  workspaceId: z.string().min(1).optional(),
  folderId: z.string().min(1).nullable().optional(),
});

export async function GET() {
  try {
    const user = await requireLibraryUser();
    const documents = await listLibraryDocuments(user.id);
    return json({ documents });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireLibraryUser();
    const input = createSchema.parse(await readJson(request));
    const document = await createDocument(user.id, input.type, input.title, input.workspaceId);
    if (input.folderId) {
      try {
        await moveDocumentToFolder(user.id, document.id, input.folderId);
      } catch (error) {
        await deleteDocument(user.id, document.id);
        throw error;
      }
    }
    return json({ id: document.id }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}

const reorderSchema = z.object({ ids: z.array(z.string()).max(500) });

export async function PUT(request: Request) {
  try {
    const user = await requireLibraryUser();
    const input = reorderSchema.parse(await readJson(request));
    await reorderDocuments(user.id, input.ids);
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
