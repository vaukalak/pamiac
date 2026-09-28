import { getAuth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

async function handle(request: Request) {
  if (!process.env.DATABASE_URL) {
    return Response.json({ error: "DATABASE_URL is not set" }, { status: 500 });
  }
  const handlers = toNextJsHandler(getAuth());
  return request.method === "POST" ? handlers.POST(request) : handlers.GET(request);
}

export const GET = handle;
export const POST = handle;
