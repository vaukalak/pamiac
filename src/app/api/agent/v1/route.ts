import { agentJson, corsHeaders, errorResponse } from "@/lib/http";
import { requireAgentUser } from "@/lib/documents";

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function GET(request: Request) {
  try {
    await requireAgentUser(request);
    return agentJson({
      name: "Pamiac agent API",
      auth: "Authorization: Bearer pam_...",
      endpoints: {
        search: {
          method: "POST",
          path: "/api/agent/v1/search",
          body: { query: "string", limit: "1-20, optional" },
        },
        list: { method: "GET", path: "/api/agent/v1/documents?type=note|diagram" },
        read: { method: "GET", path: "/api/agent/v1/documents/:id" },
        create: {
          method: "POST",
          path: "/api/agent/v1/documents",
          body: {
            type: "note | diagram",
            title: "string, optional",
            content: "markdown string, or diagram { nodes, relations }",
          },
        },
        update: {
          method: "PATCH",
          path: "/api/agent/v1/documents/:id",
          body: { title: "optional", content: "optional" },
        },
      },
      diagram: {
        nodes: {
          id: "optional, otherwise generated from name",
          kind: "class | interface | actor | participant | activation | usecase | package | component | note",
          name: "string",
          attributes: ["visibility name: type"],
          methods: ["visibility name(): type"],
          body: "used by notes",
          position: { x: 0, y: 0 },
        },
        relations: {
          from: "node id or name",
          to: "node id or name",
          type: "association | inheritance | composition | aggregation | dependency | realization",
          label: "optional",
        },
      },
    });
  } catch (error) {
    return errorResponse(error, true);
  }
}
