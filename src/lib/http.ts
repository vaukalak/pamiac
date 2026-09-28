import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
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
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
  };
}

export function agentJson(data: unknown, status = 200) {
  return json(data, status, corsHeaders());
}

export function errorResponse(error: unknown, agent = false) {
  const respond = agent ? agentJson : json;
  if (error instanceof HttpError) return respond({ error: error.message }, error.status);
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
