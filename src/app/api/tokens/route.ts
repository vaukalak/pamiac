import { z } from "zod";
import { issueToken, listTokens, requireUserId, revokeToken, updateToken } from "@/lib/documents";
import { HttpError, errorResponse, json, readJson } from "@/lib/http";
import { resolveTokenExpiration } from "@/lib/tokens";

export async function GET() {
  try {
    const user = await requireUserId();
    return json({ tokens: await listTokens(user.id) });
  } catch (error) {
    return errorResponse(error);
  }
}

const scopeSchema = z.discriminatedUnion("all", [
  z.object({ all: z.literal(true) }),
  z.object({ all: z.literal(false), workspaceIds: z.array(z.string()) }),
]);

const createSchema = z.object({
  name: z.string(),
  expiration: z.unknown(),
  scope: scopeSchema,
});

const updateSchema = z.object({
  name: z.string().optional(),
  scope: scopeSchema,
});

export async function POST(request: Request) {
  try {
    const user = await requireUserId();
    const input = createSchema.parse(await readJson(request));
    let expiresAt: Date | null;
    try {
      expiresAt = resolveTokenExpiration(input.expiration);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid expiration";
      throw new HttpError(400, message);
    }
    const token = await issueToken(user.id, input.name, expiresAt, input.scope);
    return json(token, 201);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUserId();
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return json({ error: "Token id is required" }, 400);
    const input = updateSchema.parse(await readJson(request));
    await updateToken(user.id, id, input.name, input.scope);
    return json({ ok: true });
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
