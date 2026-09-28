import { z } from "zod";
import { issueToken, listTokens, requireUserId, revokeToken } from "@/lib/documents";
import { errorResponse, json, readJson } from "@/lib/http";

export async function GET() {
  try {
    const user = await requireUserId();
    return json({ tokens: await listTokens(user.id) });
  } catch (error) {
    return errorResponse(error);
  }
}

const createSchema = z.object({ name: z.string() });

export async function POST(request: Request) {
  try {
    const user = await requireUserId();
    const input = createSchema.parse(await readJson(request));
    const token = await issueToken(user.id, input.name);
    return json(token, 201);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireUserId();
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return json({ error: "Token id is required" }, 400);
    await revokeToken(user.id, id);
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
