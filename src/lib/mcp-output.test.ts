import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { McpServer } from "@modelcontextprotocol/server";
import { documentText, readDiagram } from "./content.ts";
import { excerpt } from "./embeddings.ts";
import { presentReadableDocument } from "./mcp-documents.ts";
import { mcpToolAnnotations, mcpToolOutputs } from "./mcp-output.ts";

const origin = "https://pamiac.example";

function readable(type: "note" | "diagram", content: string) {
  const title = "Checkout";
  const text = documentText(type, title, content);
  return presentReadableDocument({
    id: "doc-1",
    type,
    title,
    url: `${origin}/d/doc-1`,
    updatedAt: new Date("2026-03-01T00:00:00.000Z"),
    version: 3,
    content: type === "diagram" ? readDiagram(content) : content,
    text,
    excerpt: excerpt(text),
  });
}

function wireValue(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

function descriptions(schema: unknown, found: string[] = []): string[] {
  if (!schema || typeof schema !== "object") return found;
  const record = schema as {
    description?: unknown;
    properties?: Record<string, unknown>;
    items?: unknown;
    anyOf?: unknown[];
    oneOf?: unknown[];
  };
  if (record.properties) {
    for (const property of Object.values(record.properties)) {
      const field = property as { description?: unknown };
      found.push(typeof field.description === "string" ? field.description : "");
      descriptions(property, found);
    }
  }
  if (record.items) descriptions(record.items, found);
  for (const branch of [...(record.anyOf ?? []), ...(record.oneOf ?? [])]) {
    descriptions(branch, found);
  }
  return found;
}

test("every tool output schema is an object and describes each field", () => {
  assert.deepEqual(Object.keys(mcpToolOutputs).sort(), [
    "create_diagram",
    "create_note",
    "get_profile",
    "list_documents",
    "read_document",
    "search_documents",
    "update_diagram",
    "update_note",
  ]);
  const server = new McpServer({ name: "pamiac", version: "1.0.0" });
  for (const [name, outputSchema] of Object.entries(mcpToolOutputs)) {
    server.registerTool(name, { outputSchema }, async () => ({
      content: [{ type: "text" as const, text: "{}" }],
    }));
  }
  const registered = (
    server as {
      _registeredTools: Record<string, { outputSchemaJson?: { type?: string } }>;
    }
  )._registeredTools;
  for (const name of Object.keys(mcpToolOutputs)) {
    const json = registered[name].outputSchemaJson;
    assert.equal(json?.type, "object", name);
    const fieldDescriptions = descriptions(json);
    assert.ok(fieldDescriptions.length > 0, name);
    assert.ok(
      fieldDescriptions.every((description) => description.length > 0),
      `${name} is missing a field description`,
    );
  }
});

test("read and write schemas accept the document each tool returns", () => {
  const note = readable("note", "# Pay\n\nInvoice");
  const diagram = readable(
    "diagram",
    JSON.stringify({
      nodes: [
        {
          kind: "class",
          name: "Order",
          attributes: ["total: number"],
          methods: ["pay(): void"],
        },
        { kind: "class", name: "Payment", attributes: ["amount: number"], methods: [] },
      ],
      relations: [{ from: "Order", to: "Payment", type: "composition", label: "charges" }],
    }),
  );

  assert.equal(diagram.content.relations.length, 1);

  for (const [schema, value] of [
    [mcpToolOutputs.read_document, note],
    [mcpToolOutputs.read_document, diagram],
    [mcpToolOutputs.create_note, note],
    [mcpToolOutputs.update_note, note],
    [mcpToolOutputs.create_diagram, diagram],
    [mcpToolOutputs.update_diagram, diagram],
  ] as const) {
    assert.deepEqual(wireValue(schema.parse(value)), wireValue(value));
  }
  assert.throws(() => mcpToolOutputs.create_note.parse(diagram));
  assert.throws(() => mcpToolOutputs.create_diagram.parse(note));
});

test("submission justifications match the tool annotations", () => {
  const source = readFileSync(new URL("./mcp-server.ts", import.meta.url), "utf8");
  const submission = JSON.parse(
    readFileSync(new URL("../../chatgpt-app-submission.json", import.meta.url), "utf8"),
  ) as {
    tools: Record<
      string,
      {
        annotations: {
          readOnlyHint: boolean;
          openWorldHint: boolean;
          destructiveHint: boolean;
        };
        justifications: {
          read_only_justification: string;
          open_world_justification: string;
          destructive_justification: string;
        };
      }
    >;
    test_cases: unknown[];
    negative_test_cases: unknown[];
  };

  assert.deepEqual(Object.keys(submission.tools).sort(), Object.keys(mcpToolAnnotations).sort());
  assert.equal(submission.test_cases.length, 5);
  assert.equal(submission.negative_test_cases.length, 3);

  const registrations = source.split("server.registerTool(").slice(1);
  assert.equal(registrations.length, Object.keys(mcpToolAnnotations).length);
  for (const registration of registrations) {
    assert.match(registration, /outputSchema:/);
  }

  for (const [name, entry] of Object.entries(submission.tools)) {
    assert.deepEqual(
      entry.annotations,
      mcpToolAnnotations[name as keyof typeof mcpToolAnnotations],
    );
    assert.match(source, new RegExp(`"${name}"`));
    for (const justification of Object.values(entry.justifications)) {
      assert.equal(justification.endsWith("."), true, name);
      assert.ok(justification.length > 20, name);
    }
  }

  assert.equal(mcpToolAnnotations.update_note.destructiveHint, true);
  assert.equal(mcpToolAnnotations.update_diagram.destructiveHint, true);
  assert.equal(mcpToolAnnotations.create_note.destructiveHint, false);
  assert.equal(mcpToolAnnotations.read_document.readOnlyHint, true);
  assert.equal(mcpToolAnnotations.read_document.openWorldHint, false);
});
