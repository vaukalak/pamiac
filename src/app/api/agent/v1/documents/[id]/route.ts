import { z } from "zod";
import {
  getOwnedDocument,
  presentDocument,
  requireAgentUser,
  updateDocumentContent,
} from "@/lib/documents";
import { agentJson, corsHeaders, errorResponse, readJson } from "@/lib/http";

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

function origin(request: Request) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`;
  return new URL(request.url).origin;
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAgentUser(request);
    const { id } = await context.params;
    const document = await getOwnedDocument(userId, id);
    if (!document) return agentJson({ error: "Document not found" }, 404);
    return agentJson(presentDocument(document, origin(request)));
  } catch (error) {
    return errorResponse(error, true);
  }
}

const updateSchema = z.object({
  title: z.string().max(160).optional(),
  content: z.unknown().optional(),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAgentUser(request);
    const { id } = await context.params;
    const input = updateSchema.parse(await readJson(request));
    const document = await updateDocumentContent(userId, id, input);
    return agentJson(presentDocument(document, origin(request)));
  } catch (error) {
    return errorResponse(error, true);
  }
}
