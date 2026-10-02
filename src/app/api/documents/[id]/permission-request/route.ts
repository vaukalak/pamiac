import { requireLibraryUser } from "@/lib/documents";
import { errorResponse, json } from "@/lib/http";
import { readDocumentPermissionRequest, requestDocumentPermission } from "@/lib/permission-request";

type Context = { params: Promise<{ id: string }> };

function caller(user: { id: string; email: string }) {
  return { userId: user.id, email: user.email };
}

export async function GET(_request: Request, context: Context) {
  try {
    const user = await requireLibraryUser();
    const { id } = await context.params;
    return json(await readDocumentPermissionRequest(caller(user), id));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(_request: Request, context: Context) {
  try {
    const user = await requireLibraryUser();
    const { id } = await context.params;
    return json(await requestDocumentPermission(caller(user), id));
  } catch (error) {
    return errorResponse(error);
  }
}
