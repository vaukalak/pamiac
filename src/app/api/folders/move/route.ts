import { z } from "zod";
import { requireLibraryUser } from "@/lib/documents";
import { moveDocumentToFolder, moveFolder } from "@/lib/folders";
import { errorResponse, json, readJson } from "@/lib/http";

const moveSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("document"),
    documentId: z.string().min(1),
    folderId: z.string().min(1).nullable(),
  }),
  z.object({
    kind: z.literal("folder"),
    folderId: z.string().min(1),
    parentId: z.string().min(1).nullable(),
  }),
]);

export async function POST(request: Request) {
  try {
    const user = await requireLibraryUser();
    const input = moveSchema.parse(await readJson(request));
    if (input.kind === "document") {
      const document = await moveDocumentToFolder(user.id, input.documentId, input.folderId);
      return json({ document });
    }
    const folder = await moveFolder(user.id, input.folderId, input.parentId);
    return json({ folder });
  } catch (error) {
    return errorResponse(error);
  }
}
