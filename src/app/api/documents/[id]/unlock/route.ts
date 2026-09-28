import { z } from "zod";
import { cookies } from "next/headers";
import { getDocumentBundle } from "@/lib/documents";
import { errorResponse, json, readJson } from "@/lib/http";
import { appSecret } from "@/lib/config";
import { signUnlock, unlockCookieName, verifyPassword } from "@/lib/passwords";

const bodySchema = z.object({ password: z.string().min(1).max(200) });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const input = bodySchema.parse(await readJson(request));
    const bundle = await getDocumentBundle(id);
    if (!bundle || bundle.document.visibility !== "password" || !bundle.document.passwordHash) {
      return json({ error: "This document is not password protected" }, 404);
    }
    if (!verifyPassword(input.password, bundle.document.passwordHash)) {
      return json({ error: "Wrong password" }, 401);
    }
    const jar = await cookies();
    jar.set(unlockCookieName(id), signUnlock(id, bundle.document.passwordHash, appSecret()), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
    });
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
