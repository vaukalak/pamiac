import { z } from "zod";
import { createFolder, listLibraryFolders } from "@/lib/folders";
import { requireLibraryUser } from "@/lib/documents";
import { errorResponse, json, readJson } from "@/lib/http";

const createSchema = z.object({
  name: z.string(),
  workspaceId: z.string().min(1).optional(),
  parentId: z.string().min(1).nullable().optional(),
});

export async function GET() {
  try {
    const user = await requireLibraryUser();
    const folders = await listLibraryFolders(user.id);
    return json({ folders });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireLibraryUser();
    const input = createSchema.parse(await readJson(request));
    const folder = await createFolder(
      user.id,
      input.name,
      input.workspaceId,
      input.parentId ?? null,
    );
    return json({ folder }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
