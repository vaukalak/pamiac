import assert from "node:assert/strict";
import test from "node:test";
import { applyDiagramPatch } from "./diagram-patch.ts";
import { gridPosition, type DiagramContent, type UmlNode } from "./diagram.ts";

function node(id: string, extra?: Partial<UmlNode>): UmlNode {
  return {
    id,
    kind: "class",
    name: id === "user" ? "User" : "Order",
    attributes: ["id: string"],
    methods: [],
    position: { x: 40, y: 40 },
    ...extra,
  };
}

function diagram(nodes: UmlNode[], relations: DiagramContent["relations"] = []): DiagramContent {
  return { nodes, relations };
}

test("two patches on different node ids both survive when the second was built from the older document", () => {
  const base = diagram([node("user", { methods: [] }), node("order", { name: "Order" })]);
  const afterUser = applyDiagramPatch(base, {
    nodes: [{ id: "user", methods: ["login(): void"] }],
  });
  const afterBoth = applyDiagramPatch(afterUser, {
    nodes: [{ id: "order", name: "Purchase" }],
  });
  const user = afterBoth.nodes.find((item) => item.id === "user");
  const order = afterBoth.nodes.find((item) => item.id === "order");
  assert.deepEqual(user?.methods, ["login(): void"]);
  assert.equal(order?.name, "Purchase");
  assert.equal(afterBoth.nodes.length, 2);
});

test("a position patch does not clobber methods written in between", () => {
  const base = diagram([node("user", { methods: [], position: { x: 420, y: 80 } })]);
  const withMethods = applyDiagramPatch(base, {
    nodes: [{ id: "user", methods: ["login(): void"] }],
  });
  const withPosition = applyDiagramPatch(withMethods, {
    nodes: [{ id: "user", position: { x: 12, y: 24 } }],
  });
  const user = withPosition.nodes[0];
  assert.deepEqual(user?.methods, ["login(): void"]);
  assert.deepEqual(user?.position, { x: 12, y: 24 });
  assert.deepEqual(user?.attributes, ["id: string"]);
});

test("a patch that omits a node does not delete it", () => {
  const base = diagram([node("user"), node("order")]);
  const next = applyDiagramPatch(base, {
    nodes: [{ id: "order", methods: ["place(): void"] }],
  });
  assert.deepEqual(
    next.nodes.map((item) => item.id),
    ["user", "order"],
  );
  assert.deepEqual(next.nodes[0]?.methods, []);
  assert.deepEqual(next.nodes[1]?.methods, ["place(): void"]);
});

test("attributes and methods replace the whole list when present", () => {
  const base = diagram([
    node("user", { attributes: ["id: string", "email: string"], methods: ["login(): void"] }),
  ]);
  const next = applyDiagramPatch(base, {
    nodes: [{ id: "user", attributes: ["name: string"] }],
  });
  assert.deepEqual(next.nodes[0]?.attributes, ["name: string"]);
  assert.deepEqual(next.nodes[0]?.methods, ["login(): void"]);
});

test("an update that omits position keeps the layout", () => {
  const base = diagram([node("user", { position: { x: 420, y: 80 } })]);
  const next = applyDiagramPatch(base, { nodes: [{ id: "user", name: "Person" }] });
  assert.equal(next.nodes[0]?.name, "Person");
  assert.deepEqual(next.nodes[0]?.position, { x: 420, y: 80 });
});

test("a new node without an id position uses the grid and requires kind and name", () => {
  const base = diagram([node("user")]);
  const next = applyDiagramPatch(base, {
    nodes: [{ id: "order", kind: "class", name: "Order" }],
  });
  assert.deepEqual(next.nodes.find((item) => item.id === "order")?.position, gridPosition(1));
  assert.throws(
    () => applyDiagramPatch(base, { nodes: [{ id: "order", name: "Order" }] }),
    /Node order needs a kind and a name/,
  );
});

test("the same field last write wins", () => {
  const base = diagram([node("user", { methods: ["a(): void"] })]);
  const first = applyDiagramPatch(base, { nodes: [{ id: "user", methods: ["b(): void"] }] });
  const second = applyDiagramPatch(first, { nodes: [{ id: "user", methods: ["c(): void"] }] });
  assert.deepEqual(second.nodes[0]?.methods, ["c(): void"]);
});

test("relations resolve by name or id and an omitted label stays", () => {
  const base = diagram(
    [node("user", { name: "User" }), node("order", { name: "Order" })],
    [{ id: "rel-1", from: "user", to: "order", type: "association", label: "places" }],
  );
  const next = applyDiagramPatch(base, {
    relations: [
      { id: "rel-1", from: "user", to: "order", type: "composition" },
      { id: "rel-2", from: "User", to: "Order", type: "dependency", label: "uses" },
    ],
  });
  assert.equal(next.relations.find((item) => item.id === "rel-1")?.type, "composition");
  assert.equal(next.relations.find((item) => item.id === "rel-1")?.label, "places");
  assert.equal(next.relations.find((item) => item.id === "rel-2")?.from, "user");
  assert.equal(next.relations.find((item) => item.id === "rel-2")?.label, "uses");
});

test("deleteRelations removes one link and leaves both nodes", () => {
  const base = diagram(
    [node("user"), node("order")],
    [
      { id: "rel-1", from: "user", to: "order", type: "association" },
      { id: "rel-2", from: "order", to: "user", type: "dependency" },
    ],
  );
  const next = applyDiagramPatch(base, { deleteRelations: ["rel-1"] });
  assert.deepEqual(
    next.relations.map((item) => item.id),
    ["rel-2"],
  );
  assert.equal(next.nodes.length, 2);
});

test("an empty stereotype clears and a missing stereotype stays", () => {
  const base = diagram([node("user", { stereotype: "entity" })]);
  const cleared = applyDiagramPatch(base, { nodes: [{ id: "user", stereotype: "" }] });
  assert.equal(cleared.nodes[0]?.stereotype, undefined);
  const kept = applyDiagramPatch(base, { nodes: [{ id: "user", name: "Person" }] });
  assert.equal(kept.nodes[0]?.stereotype, "entity");
});

test("deleteNodes removes the node and relations that touch it", () => {
  const base = diagram(
    [node("user"), node("order")],
    [{ id: "rel-1", from: "user", to: "order", type: "association", label: "places" }],
  );
  const next = applyDiagramPatch(base, { deleteNodes: ["user"] });
  assert.deepEqual(
    next.nodes.map((item) => item.id),
    ["order"],
  );
  assert.deepEqual(next.relations, []);
});
