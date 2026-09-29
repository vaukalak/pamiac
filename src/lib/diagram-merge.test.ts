import assert from "node:assert/strict";
import test from "node:test";
import { mergeRemoteDiagram, type DiagramDirtyState } from "./diagram-merge.ts";
import type { DiagramContent, UmlNode, UmlRelation } from "./diagram.ts";

function node(id: string, extra?: Partial<UmlNode>): UmlNode {
  return {
    id,
    kind: "class",
    name: id,
    attributes: [],
    methods: [],
    position: { x: 1, y: 1 },
    ...extra,
  };
}

function relation(id: string, extra?: Partial<UmlRelation>): UmlRelation {
  return { id, from: "user", to: "order", type: "association", ...extra };
}

function dirty(extra?: Partial<DiagramDirtyState>): DiagramDirtyState {
  return {
    nodeFields: {},
    pendingNodeIds: [],
    deletedNodeIds: [],
    pendingRelationIds: [],
    deletedRelationIds: [],
    ...extra,
  };
}

const local = {
  nodes: [
    node("user", { methods: ["local(): void"], position: { x: 5, y: 6 } }),
    node("order", { name: "Order" }),
    node("draft", { name: "Draft" }),
  ],
  relations: [relation("rel-1", { label: "local" }), relation("rel-new", { label: "pending" })],
} satisfies DiagramContent;

test("remote fields apply and dirty fields stay", () => {
  const remote = {
    nodes: [
      node("user", {
        methods: ["remote(): void"],
        attributes: ["email: string"],
        position: { x: 9, y: 9 },
      }),
      node("order", { name: "Purchase", methods: ["place(): void"] }),
    ],
    relations: [relation("rel-1", { label: "remote" })],
  } satisfies DiagramContent;
  const merged = mergeRemoteDiagram(
    local,
    remote,
    dirty({
      nodeFields: { user: ["methods", "position"] },
      pendingNodeIds: ["draft"],
      pendingRelationIds: ["rel-new"],
    }),
  );
  const user = merged.nodes.find((item) => item.id === "user");
  const order = merged.nodes.find((item) => item.id === "order");
  assert.deepEqual(user?.methods, ["local(): void"]);
  assert.deepEqual(user?.position, { x: 5, y: 6 });
  assert.deepEqual(user?.attributes, ["email: string"]);
  assert.equal(order?.name, "Purchase");
  assert.deepEqual(order?.methods, ["place(): void"]);
  assert.equal(
    merged.nodes.some((item) => item.id === "draft"),
    true,
  );
  assert.equal(merged.relations.find((item) => item.id === "rel-1")?.label, "remote");
  assert.equal(merged.relations.find((item) => item.id === "rel-new")?.label, "pending");
});

test("a dirty node the server deleted stays and a clean node the server deleted is removed", () => {
  const remote = {
    nodes: [node("order", { name: "Purchase" })],
    relations: [],
  } satisfies DiagramContent;
  const merged = mergeRemoteDiagram(
    {
      nodes: [node("user", { methods: ["login(): void"] }), node("order"), node("gone")],
      relations: [relation("rel-1")],
    },
    remote,
    dirty({ nodeFields: { user: ["methods"] } }),
  );
  assert.equal(
    merged.nodes.some((item) => item.id === "user"),
    true,
  );
  assert.deepEqual(merged.nodes.find((item) => item.id === "user")?.methods, ["login(): void"]);
  assert.equal(
    merged.nodes.some((item) => item.id === "gone"),
    false,
  );
  assert.equal(
    merged.nodes.some((item) => item.id === "order"),
    true,
  );
  assert.equal(
    merged.relations.some((item) => item.id === "rel-1"),
    false,
  );
});

test("a pending create stays and a clean relation the server deleted is removed", () => {
  const merged = mergeRemoteDiagram(
    {
      nodes: [node("fresh", { name: "Fresh" }), node("user")],
      relations: [relation("keep", { label: "mine" }), relation("drop")],
    },
    {
      nodes: [node("user", { name: "Person" })],
      relations: [],
    },
    dirty({ pendingNodeIds: ["fresh"], pendingRelationIds: ["keep"] }),
  );
  assert.equal(merged.nodes.find((item) => item.id === "fresh")?.name, "Fresh");
  assert.equal(merged.nodes.find((item) => item.id === "user")?.name, "Person");
  assert.equal(merged.relations.find((item) => item.id === "keep")?.label, "mine");
  assert.equal(
    merged.relations.some((item) => item.id === "drop"),
    false,
  );
});

test("a server-only node is added and a locally deleted node is not resurrected", () => {
  const merged = mergeRemoteDiagram(
    { nodes: [node("user")], relations: [] },
    { nodes: [node("user"), node("extra", { name: "Extra" })], relations: [] },
    dirty({ deletedNodeIds: ["user"] }),
  );
  assert.equal(
    merged.nodes.some((item) => item.id === "user"),
    false,
  );
  assert.equal(merged.nodes.find((item) => item.id === "extra")?.name, "Extra");
});
