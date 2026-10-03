import { ZodError } from "zod";

export class HttpError extends Error {
  status: number;
  version?: number;
  title?: string;
  content?: unknown;

  constructor(
    status: number,
    message: string,
    details?: number | { version: number; title?: string; content?: unknown },
  ) {
    super(message);
    this.status = status;
    if (typeof details === "number") {
      this.version = details;
      return;
    }
    this.version = details?.version;
    this.title = details?.title;
    this.content = details?.content;
  }
}

export function json(data: unknown, status = 200, headers?: HeadersInit) {
  return Response.json(data, { status, headers });
}

export async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, "Expected a JSON body");
  }
}

export function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, OPTIONS",
  };
}

export function agentJson(data: unknown, status = 200) {
  return json(data, status, corsHeaders());
}

export function errorResponse(error: unknown, agent = false) {
  const respond = agent ? agentJson : json;
  if (error instanceof HttpError) {
    if (error.version === undefined) return respond({ error: error.message }, error.status);
    return respond(
      {
        error: error.message,
        version: error.version,
        title: error.title,
        content: error.content,
      },
      error.status,
    );
  }
  if (error instanceof ZodError) {
    return respond({ error: error.issues[0]?.message ?? "Invalid request" }, 400);
  }
  if (error instanceof Error && error.message.startsWith("Relation ")) {
    return respond({ error: error.message }, 400);
  }
  if (error instanceof Error && error.message.startsWith("Invalid email")) {
    return respond({ error: error.message }, 400);
  }
  console.error(error);
  return respond({ error: "Something went wrong" }, 500);
}
