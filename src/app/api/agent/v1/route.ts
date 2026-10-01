import { PAMIAC_TOKEN_COOKIE, requireAgentUser } from "@/lib/documents";
import { UML_KINDS } from "@/lib/diagram";
import { agentJson, corsHeaders, errorResponse } from "@/lib/http";

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function GET(request: Request) {
  try {
    await requireAgentUser(request);
    return agentJson({
      name: "Pamiac agent API",
      auth: "Authorization: Bearer <PAMIAC_TOKEN>",
      token:
        "Read PAMIAC_TOKEN from the agent environment. Do not ask the user to paste the token. If PAMIAC_TOKEN is missing, say so and stop.",
      cookie: `To browse the library in a browser, set a cookie on the app origin: name \`${PAMIAC_TOKEN_COOKIE}\`, value the PAMIAC_TOKEN value, path \`/\`. Then open \`/workspace\`. A document is \`/d/<id>\`. Do not print the token. \`/workspace/tokens\` still requires the magic-link session.`,
      app: "The origin the user is using. Ask for the app URL if you do not already know it.",
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
          body: {
            title: "optional",
            content:
              "optional full replace. Notes are markdown. Diagram content replaces the whole diagram.",
            patch:
              "optional diagram merge. GET the document in the same turn, then send only the nodes you change, with ids from that GET. Omit other nodes. Omit position to keep layout.",
            version:
              "required. The version from GET /api/agent/v1/documents/:id in the same turn. A mismatch returns 409 with the current version. GET the document again, re-apply the change onto that content, and PATCH with the new version. Rebuild a diagram patch against the new document. Do not resend a stale full replace.",
          },
        },
      },
      diagram: {
        nodes: {
          id: "optional, otherwise generated from name",
          kind: UML_KINDS.join(" | "),
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
