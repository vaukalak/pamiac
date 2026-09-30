import { z } from "zod";
import { presentDocument, requireAgentUser, searchDocuments } from "@/lib/documents";
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

const searchSchema = z.object({
  query: z.string().min(1).max(500),
  limit: z.number().int().min(1).max(20).optional(),
});

export async function POST(request: Request) {
  try {
    const agent = await requireAgentUser(request);
    const input = searchSchema.parse(await readJson(request));
    const rows = await searchDocuments(agent.id, input.query, input.limit ?? 8, agent.workspaceId);
    return agentJson({
      results: rows.map((row) => {
        const presented = presentDocument(row, origin(request));
        return {
          id: presented.id,
          type: presented.type,
          title: presented.title,
          url: presented.url,
          score: row.score,
          excerpt: presented.excerpt,
        };
      }),
    });
  } catch (error) {
    return errorResponse(error, true);
  }
}
