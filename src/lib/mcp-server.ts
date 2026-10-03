import { McpServer } from "@modelcontextprotocol/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { user } from "@/db/schema";
import { MAX_CONTENT_LENGTH } from "@/lib/config";
import {
  agentCreateWorkspace,
  createDocument,
  getAgentDocument,
  listAgentDocuments,
  listAgentWorkspaces,
  presentDocument,
  searchAccountDocuments,
  searchDocuments,
  updateDocumentContent,
  type AgentScope,
} from "@/lib/documents";
import { UML_KINDS, UML_RELATIONS } from "@/lib/diagram";
import { diagramPatchSchema } from "@/lib/diagram-patch";
import {
  createAgentFolder,
  listAgentFolders,
  moveAgentDocumentToFolder,
  moveAgentFolder,
} from "@/lib/folders";
import { HttpError } from "@/lib/http";
import { MCP_INSTRUCTIONS, UPDATE_DIAGRAM_DESCRIPTION } from "@/lib/mcp-instructions";
import {
  presentListedDocument,
  presentReadableDocument,
  presentSearchHit,
} from "@/lib/mcp-documents";
import { createAnnotations, readAnnotations, replaceAnnotations } from "@/lib/mcp-annotations";
import { profileContent } from "@/lib/mcp-profile";
import { starterPrompts } from "@/lib/mcp-prompts";
import { attachPamiacSkill } from "@/lib/mcp-skill";

const profileOutput = z
  .object({
    id: z.string().min(1),
    name: z.string().optional(),
    email: z.string().optional(),
  })
  .strict();

const searchHit = z
  .object({
    id: z.string(),
    type: z.string(),
    title: z.string(),
    url: z.string(),
    score: z.number(),
    excerpt: z.string(),
  })
  .strict();

const listedDocument = z
  .object({
    id: z.string(),
    type: z.string(),
    title: z.string(),
    url: z.string(),
    updatedAt: z.string(),
    folderId: z.string().nullable(),
  })
  .strict();

const folderSummary = z
  .object({
    id: z.string(),
    name: z.string(),
    parentId: z.string().nullable(),
    workspaceId: z.string().nullable(),
  })
  .strict();

const folderRecord = folderSummary
  .extend({
    sortIndex: z.number(),
  })
  .strict();

const documentId = z.string().min(1).max(200);
const titleField = z.string().max(160).optional();

const searchInput = z
  .object({
    query: z.string().min(1).max(500),
    limit: z.number().int().min(1).max(20).default(8),
  })
  .strict();

const listInput = z
  .object({
    type: z.enum(["note", "diagram"]).optional(),
  })
  .strict();

const readInput = z.object({ id: documentId }).strict();

const createFolderInput = z
  .object({
    name: z.string(),
    parentId: z.string().min(1).nullable().optional(),
    workspaceId: z.string().min(1).optional(),
  })
  .strict();

const moveDocumentToFolderInput = z
  .object({
    documentId,
    folderId: z.string().min(1).nullable(),
  })
  .strict();

const moveFolderInput = z
  .object({
    folderId: z.string().min(1),
    parentId: z.string().min(1).nullable(),
  })
  .strict();

const workspaceOutput = z
  .object({
    workspaces: z.array(z.object({ id: z.string(), name: z.string() }).strict()),
  })
  .strict();

const createNoteInput = z
  .object({
    title: titleField,
    content: z.string().max(MAX_CONTENT_LENGTH),
  })
  .strict();

const diagramNodeInput = z.object({
  id: z.string().min(1).max(80).optional(),
  kind: z.enum(UML_KINDS),
  name: z.string().min(1).max(120),
  stereotype: z.string().max(80).optional(),
  attributes: z.array(z.string().max(200)).max(40).optional(),
  methods: z.array(z.string().max(200)).max(40).optional(),
  body: z.string().max(2000).optional(),
  position: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .optional(),
});

const diagramRelationInput = z.object({
  id: z.string().min(1).max(80).optional(),
  from: z.string().min(1).max(80),
  to: z.string().min(1).max(80),
  type: z.enum(UML_RELATIONS),
  label: z.string().max(120).optional(),
});

const createDiagramInput = z
  .object({
    title: titleField,
    nodes: z.array(diagramNodeInput).max(200),
    relations: z.array(diagramRelationInput).max(400),
  })
  .strict();

const documentVersion = z.number().int().positive();

const updateNoteInput = z
  .object({
    id: documentId,
    title: titleField,
    content: z.string().max(MAX_CONTENT_LENGTH),
    version: documentVersion,
  })
  .strict();

const updateDiagramInput = diagramPatchSchema
  .extend({
    id: documentId,
    title: titleField,
    version: documentVersion,
  })
  .strict();

function textResult(payload: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(payload) }],
    structuredContent: payload,
  };
}

function errorResult(message: string) {
  return {
    isError: true as const,
    content: [{ type: "text" as const, text: message }],
  };
}

function failureMessage(error: unknown) {
  if (error instanceof HttpError) {
    if (error.version === undefined) return error.message;
    return JSON.stringify({
      error: error.message,
      version: error.version,
      title: error.title,
      content: error.content,
    });
  }
  if (error instanceof Error) return error.message;
  return "Request failed";
}

async function loadUser(userId: string) {
  const [row] = await getDb()
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .where(eq(user.id, userId));
  return row ?? null;
}

async function readableDocument(userId: string, id: string, origin: string, scope: AgentScope) {
  const document = await getAgentDocument(userId, id, scope);
  if (!document) return null;
  return presentReadableDocument(presentDocument(document, origin));
}

export function createPamiacMcpServer(
  userId: string,
  origin: string,
  scope: AgentScope = { allScopes: true, workspaceIds: [] },
) {
  const server = new McpServer(
    { name: "pamiac", version: "1.0.0" },
    { instructions: MCP_INSTRUCTIONS },
  );

  server.registerTool(
    "get_profile",
    {
      description:
        "Return the signed-in Pamiac account id, and name or email when the account has them.",
      inputSchema: z.object({}).strict(),
      outputSchema: profileOutput,
      annotations: readAnnotations,
      _meta: { "openai/profile": true },
    },
    async () => {
      if (!userId) return errorResult("Sign-in required");
      try {
        const row = await loadUser(userId);
        if (!row) return errorResult("Account not found");
        return textResult(profileContent(row));
      } catch (error) {
        return errorResult(failureMessage(error));
      }
    },
  );

  server.registerTool(
    "search_documents",
    {
      description: "Search this account's notes and diagrams. Use it before creating a duplicate.",
      inputSchema: searchInput,
      outputSchema: z.object({ results: z.array(searchHit) }).strict(),
      annotations: readAnnotations,
    },
    async ({ query, limit }) => {
      if (!userId) return errorResult("Sign-in required");
      try {
        const rows = scope.allScopes
          ? await searchAccountDocuments(userId, query, limit)
          : await searchDocuments(userId, query, limit, scope);
        return textResult({
          results: rows.map((row) => presentSearchHit(presentDocument(row, origin), row.score)),
        });
      } catch (error) {
        return errorResult(failureMessage(error));
      }
    },
  );

  server.registerTool(
    "list_workspaces",
    {
      description:
        "List the workspaces this connection can reach. Call it when the user does not name a workspace.",
      inputSchema: z.object({}).strict(),
      outputSchema: workspaceOutput,
      annotations: readAnnotations,
    },
    async () => {
      if (!userId) return errorResult("Sign-in required");
      try {
        const workspaces = await listAgentWorkspaces(userId, scope);
        return textResult({ workspaces });
      } catch (error) {
        return errorResult(failureMessage(error));
      }
    },
  );

  server.registerTool(
    "list_folders",
    {
      description:
        "List folders this connection can reach. workspaceId is null for the personal library.",
      inputSchema: z.object({}).strict(),
      outputSchema: z.object({ folders: z.array(folderSummary) }).strict(),
      annotations: readAnnotations,
    },
    async () => {
      if (!userId) return errorResult("Sign-in required");
      try {
        const folders = await listAgentFolders(userId, scope);
        return textResult({ folders });
      } catch (error) {
        return errorResult(failureMessage(error));
      }
    },
  );

  server.registerTool(
    "list_documents",
    {
      description: "List this account's notes and diagrams.",
      inputSchema: listInput,
      outputSchema: z.object({ documents: z.array(listedDocument) }).strict(),
      annotations: readAnnotations,
    },
    async ({ type }) => {
      if (!userId) return errorResult("Sign-in required");
      try {
        const rows = await listAgentDocuments(userId, scope);
        const documents = rows
          .filter((row) => !type || row.type === type)
          .map((row) => presentListedDocument(row, origin));
        return textResult({ documents });
      } catch (error) {
        return errorResult(failureMessage(error));
      }
    },
  );

  server.registerTool(
    "read_document",
    {
      description: "Read one note or diagram owned by this account.",
      inputSchema: readInput,
      annotations: readAnnotations,
    },
    async ({ id }) => {
      if (!userId) return errorResult("Sign-in required");
      try {
        const document = await readableDocument(userId, id, origin, scope);
        if (!document) return errorResult("Document not found");
        return textResult(document);
      } catch (error) {
        return errorResult(failureMessage(error));
      }
    },
  );

  server.registerTool(
    "create_note",
    {
      description: "Create a markdown note in this account.",
      inputSchema: createNoteInput,
      annotations: createAnnotations,
    },
    async ({ title, content }) => {
      if (!userId) return errorResult("Sign-in required");
      try {
        const workspaceId = await agentCreateWorkspace(userId, scope);
        const created = await createDocument(userId, "note", title, workspaceId);
        const document = await updateDocumentContent(userId, created.id, { content }, scope);
        return textResult(presentReadableDocument(presentDocument(document, origin)));
      } catch (error) {
        return errorResult(failureMessage(error));
      }
    },
  );

  server.registerTool(
    "create_diagram",
    {
      description:
        "Create a UML diagram. Nodes use kind, name, attributes, and methods. Relations use type.",
      inputSchema: createDiagramInput,
      annotations: createAnnotations,
    },
    async ({ title, nodes, relations }) => {
      if (!userId) return errorResult("Sign-in required");
      try {
        const workspaceId = await agentCreateWorkspace(userId, scope);
        const created = await createDocument(userId, "diagram", title, workspaceId);
        const document = await updateDocumentContent(
          userId,
          created.id,
          { content: { nodes, relations } },
          scope,
        );
        return textResult(presentReadableDocument(presentDocument(document, origin)));
      } catch (error) {
        return errorResult(failureMessage(error));
      }
    },
  );

  server.registerTool(
    "update_note",
    {
      description:
        "Replace a note with the full markdown content. Send version from read_document. On conflict, the error includes the current version, title, and content. Re-apply onto that content and update with that version.",
      inputSchema: updateNoteInput,
      annotations: replaceAnnotations,
    },
    async ({ id, title, content, version }) => {
      if (!userId) return errorResult("Sign-in required");
      try {
        const document = await updateDocumentContent(
          userId,
          id,
          {
            title,
            content,
            expectedVersion: version,
          },
          scope,
        );
        return textResult(presentReadableDocument(presentDocument(document, origin)));
      } catch (error) {
        return errorResult(failureMessage(error));
      }
    },
  );

  server.registerTool(
    "update_diagram",
    {
      description: UPDATE_DIAGRAM_DESCRIPTION,
      inputSchema: updateDiagramInput,
      annotations: replaceAnnotations,
    },
    async ({ id, title, version, nodes, deleteNodes, relations, deleteRelations }) => {
      if (!userId) return errorResult("Sign-in required");
      try {
        const document = await updateDocumentContent(
          userId,
          id,
          {
            title,
            patch: { nodes, deleteNodes, relations, deleteRelations },
            expectedVersion: version,
          },
          scope,
        );
        return textResult(presentReadableDocument(presentDocument(document, origin)));
      } catch (error) {
        return errorResult(failureMessage(error));
      }
    },
  );

  server.registerTool(
    "create_folder",
    {
      description:
        "Create a folder. Omit workspaceId to use the same library as create_note. Omit parentId, or pass null, to create it at the library root.",
      inputSchema: createFolderInput,
      outputSchema: folderRecord,
      annotations: createAnnotations,
    },
    async ({ name, parentId, workspaceId }) => {
      if (!userId) return errorResult("Sign-in required");
      try {
        const folder = await createAgentFolder(userId, scope, name, workspaceId, parentId ?? null);
        return textResult(folder);
      } catch (error) {
        return errorResult(failureMessage(error));
      }
    },
  );

  server.registerTool(
    "move_document_to_folder",
    {
      description:
        "Move a note or diagram into a folder in the same library. folderId null moves it to the library root.",
      inputSchema: moveDocumentToFolderInput,
      outputSchema: z.object({ id: z.string(), folderId: z.string().nullable() }).strict(),
      annotations: createAnnotations,
    },
    async ({ documentId: id, folderId }) => {
      if (!userId) return errorResult("Sign-in required");
      try {
        const document = await moveAgentDocumentToFolder(userId, scope, id, folderId);
        return textResult(document);
      } catch (error) {
        return errorResult(failureMessage(error));
      }
    },
  );

  server.registerTool(
    "move_folder",
    {
      description:
        "Move a folder under another folder in the same library. parentId null moves it to the library root. A folder cannot move into itself.",
      inputSchema: moveFolderInput,
      outputSchema: folderRecord,
      annotations: createAnnotations,
    },
    async ({ folderId, parentId }) => {
      if (!userId) return errorResult("Sign-in required");
      try {
        const folder = await moveAgentFolder(userId, scope, folderId, parentId);
        return textResult(folder);
      } catch (error) {
        return errorResult(failureMessage(error));
      }
    },
  );

  for (const prompt of starterPrompts) {
    server.registerPrompt(
      prompt.name,
      { title: prompt.title, description: prompt.description },
      () => ({
        messages: [
          {
            role: "user",
            content: { type: "text", text: prompt.text },
          },
        ],
      }),
    );
  }

  attachPamiacSkill(server);

  return server;
}
