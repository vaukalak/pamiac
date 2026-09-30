import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/lib/auth";
import { ensureLiveJwks } from "@/lib/ensure-jwks";

export async function handleAuthRequest(request: Request) {
  if (!process.env.DATABASE_URL) {
    return Response.json({ error: "DATABASE_URL is not set" }, { status: 500 });
  }
  await ensureLiveJwks();
  const handlers = toNextJsHandler(getAuth());
  return request.method === "POST" ? handlers.POST(request) : handlers.GET(request);
}
