import assert from "node:assert/strict";
import test from "node:test";
import { applyDocumentWrite, documentVersionConflict } from "./document-write.ts";

const user = {
  id: "user",
  kind: "class",
  name: "User",
  attributes: ["id: string"],
  methods: [] as string[],
  position: { x: 10, y: 20 },
};

const order = {
  id: "order",
  kind: "class",
  name: "Order",
  attributes: [] as string[],
  methods: [] as string[],
  position: { x: 300, y: 20 },
};

test("each successful diagram patch increments version once and keeps both nodes", () => {
  const current = {
    type: "diagram" as const,
    content: JSON.stringify({ nodes: [user, order], relations: [] }),
    version: 1,
  };
  const first = applyDocumentWrite(current, {
    patch: { nodes: [{ id: "user", methods: ["login(): void"] }] },
  });
  assert.equal(first.version, 2);
  const second = applyDocumentWrite(
    { type: "diagram", content: first.content, version: first.version },
    { patch: { nodes: [{ id: "order", name: "Purchase" }] } },
  );
  assert.equal(second.version, 3);
  const diagram = JSON.parse(second.content) as {
    nodes: Array<{ id: string; name: string; methods: string[] }>;
  };
  assert.deepEqual(diagram.nodes.find((node) => node.id === "user")?.methods, ["login(): void"]);
  assert.equal(diagram.nodes.find((node) => node.id === "order")?.name, "Purchase");
});

test("a note write replaces the whole markdown and increments version once", () => {
  const first = applyDocumentWrite(
    { type: "note", content: "one", version: 1 },
    { content: "two" },
  );
  assert.equal(first.content, "two");
  assert.equal(first.version, 2);
  const second = applyDocumentWrite(
    { type: "note", content: first.content, version: first.version },
    { content: "# older draft" },
  );
  assert.equal(second.content, "# older draft");
  assert.equal(second.version, 3);
});

test("diagram content is a full replace and still increments version once", () => {
  const next = applyDocumentWrite(
    {
      type: "diagram",
      content: JSON.stringify({ nodes: [user, order], relations: [] }),
      version: 4,
    },
    { content: { nodes: [user], relations: [] } },
  );
  const diagram = JSON.parse(next.content) as { nodes: Array<{ id: string }> };
  assert.deepEqual(
    diagram.nodes.map((node) => node.id),
    ["user"],
  );
  assert.equal(next.version, 5);
});

test("a title-only write keeps content and increments version once", () => {
  const next = applyDocumentWrite({ type: "note", content: "body", version: 7 }, {});
  assert.equal(next.content, "body");
  assert.equal(next.version, 8);
});

test("a patch on a note is rejected and does not change the markdown", () => {
  assert.throws(
    () =>
      applyDocumentWrite(
        { type: "note", content: "# stay", version: 2 },
        { patch: { nodes: [{ id: "user", methods: ["login(): void"] }] } },
      ),
    /Patch applies to diagrams/,
  );
});

test("a matching expected version allows the write", () => {
  assert.equal(documentVersionConflict(4, 4), null);
});

test("a mismatched expected version returns the current version", () => {
  assert.equal(documentVersionConflict(4, 3), 4);
});

test("a missing expected version allows the write", () => {
  assert.equal(documentVersionConflict(4, undefined), null);
});

test("content and patch together are rejected", () => {
  assert.throws(
    () =>
      applyDocumentWrite(
        { type: "diagram", content: JSON.stringify({ nodes: [], relations: [] }), version: 1 },
        { content: { nodes: [], relations: [] }, patch: { nodes: [] } },
      ),
    /Send content or patch, not both/,
  );
});
