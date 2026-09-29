import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/lib/auth";

export async function handleAuthRequest(request: Request) {
  if (!process.env.DATABASE_URL) {
    return Response.json({ error: "DATABASE_URL is not set" }, { status: 500 });
  }
  const handlers = toNextJsHandler(getAuth());
  return request.method === "POST" ? handlers.POST(request) : handlers.GET(request);
}
