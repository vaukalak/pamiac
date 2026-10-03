import { z } from "zod";
import { VISIBILITIES } from "@/lib/access";
import { requireLibraryUser } from "@/lib/documents";
import { updateFolderShare } from "@/lib/folders";
import { errorResponse, json, readJson } from "@/lib/http";

const shareSchema = z.object({
  visibility: z.enum(VISIBILITIES),
  password: z.string().max(200).optional(),
  emails: z.array(z.string()).max(50).optional(),
});

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireLibraryUser();
    const { id } = await context.params;
    const input = shareSchema.parse(await readJson(request));
    const share = await updateFolderShare(user.id, id, input);
    return json({
      visibility: share.visibility,
      emails: share.emails,
      hasPassword: share.hasPassword,
      url: share.url,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
