import { z } from "zod";
import { UML_KINDS, UML_RELATIONS } from "./diagram.ts";

export const readAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  openWorldHint: false,
} as const;

export const createAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  openWorldHint: false,
} as const;

export const updateAnnotations = {
  readOnlyHint: false,
  destructiveHint: true,
  openWorldHint: false,
} as const;

export const profileOutput = z
  .object({
    id: z.string().min(1).describe("Account id"),
    name: z.string().optional().describe("Display name when the account has one"),
    email: z.string().optional().describe("Email when the account has one"),
  })
  .strict();

const searchHit = z
  .object({
    id: z.string().describe("Document id"),
    type: z.string().describe("note or diagram"),
    title: z.string().describe("Document title"),
    url: z.string().describe("Absolute URL of the document"),
    score: z.number().describe("Similarity score for this hit"),
    excerpt: z.string().describe("Short preview of the matching text"),
  })
  .strict();

const listedDocument = z
  .object({
    id: z.string().describe("Document id"),
    type: z.string().describe("note or diagram"),
    title: z.string().describe("Document title"),
    url: z.string().describe("Absolute URL of the document"),
    updatedAt: z.string().describe("ISO-8601 time of the last update"),
  })
  .strict();

const diagramNodeOutput = z
  .object({
    id: z.string().describe("Stable element id"),
    kind: z.enum(UML_KINDS).describe("UML element kind"),
    name: z.string().describe("Element name"),
    stereotype: z.string().optional().describe("UML stereotype"),
    attributes: z.array(z.string()).describe("Attribute lines, such as total: number"),
    methods: z.array(z.string()).describe("Method lines, such as pay(): void"),
    body: z.string().optional().describe("Note text"),
    position: z
      .object({
        x: z.number().describe("Canvas x"),
        y: z.number().describe("Canvas y"),
      })
      .strict()
      .optional()
      .describe("Saved canvas position"),
  })
  .strict();

const diagramRelationOutput = z
  .object({
    id: z.string().describe("Stable relation id"),
    from: z.string().describe("Source element id"),
    to: z.string().describe("Target element id"),
    type: z.enum(UML_RELATIONS).describe("Relation type"),
    label: z.string().optional().describe("Relation label"),
  })
  .strict();

const diagramContentOutput = z
  .object({
    nodes: z.array(diagramNodeOutput).describe("UML elements"),
    relations: z.array(diagramRelationOutput).describe("Links between elements"),
  })
  .strict();

const noteContentOutput = z.string().describe("Full markdown");

function documentOutput(type: z.ZodType, content: z.ZodType) {
  return z
    .object({
      id: z.string().describe("Document id"),
      type,
      title: z.string().describe("Document title"),
      url: z.string().describe("Absolute URL of the document"),
      updatedAt: z.string().describe("ISO-8601 time of the last update"),
      version: z.number().int().describe("Document version"),
      content,
      text: z.string().describe("Plain-text rendering used for search"),
      excerpt: z.string().describe("Short preview of the plain text"),
    })
    .strict();
}

export const noteDocumentOutput = documentOutput(
  z.literal("note").describe("Document type"),
  noteContentOutput,
);

export const diagramDocumentOutput = documentOutput(
  z.literal("diagram").describe("Document type"),
  diagramContentOutput.describe("UML nodes and relations"),
);

export const readableDocumentOutput = documentOutput(
  z.enum(["note", "diagram"]).describe("note or diagram"),
  z
    .union([noteContentOutput, diagramContentOutput])
    .describe("Markdown when type is note. Nodes and relations when type is diagram."),
);

export const searchDocumentsOutput = z
  .object({
    results: z.array(searchHit).describe("Matching notes and diagrams"),
  })
  .strict();

export const listDocumentsOutput = z
  .object({
    documents: z.array(listedDocument).describe("Notes and diagrams in this account"),
  })
  .strict();

export const mcpToolOutputs = {
  get_profile: profileOutput,
  search_documents: searchDocumentsOutput,
  list_documents: listDocumentsOutput,
  read_document: readableDocumentOutput,
  create_note: noteDocumentOutput,
  create_diagram: diagramDocumentOutput,
  update_note: noteDocumentOutput,
  update_diagram: diagramDocumentOutput,
};

export const mcpToolAnnotations = {
  get_profile: readAnnotations,
  search_documents: readAnnotations,
  list_documents: readAnnotations,
  read_document: readAnnotations,
  create_note: createAnnotations,
  create_diagram: createAnnotations,
  update_note: updateAnnotations,
  update_diagram: updateAnnotations,
};
