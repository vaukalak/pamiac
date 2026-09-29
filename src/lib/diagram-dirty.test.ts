import assert from "node:assert/strict";
import test from "node:test";
import {
  acknowledgePatch,
  buildDiagramPatch,
  createDiagramDirty,
  markNodeField,
  syncDirtyWithRemote,
} from "./diagram-dirty.ts";
import type { DiagramContent, UmlNode } from "./diagram.ts";

function node(id: string, extra?: Partial<UmlNode>): UmlNode {
  return {
    id,
    kind: "class",
    name: "User",
    attributes: ["id: string"],
    methods: ["login(): void"],
    position: { x: 4, y: 8 },
    ...extra,
  };
}

function diagram(nodes: UmlNode[]): DiagramContent {
  return { nodes, relations: [] };
}

test("acknowledge keeps a field edited after the patch was sent", () => {
  const dirty = createDiagramDirty();
  markNodeField(dirty, "user", "methods");
  markNodeField(dirty, "user", "name");
  const sent = buildDiagramPatch(diagram([node("user", { name: "User" })]), dirty);
  const current = diagram([node("user", { name: "Person", methods: ["login(): void"] })]);
  acknowledgePatch(dirty, sent, current);
  assert.deepEqual([...(dirty.nodeFields.get("user") ?? [])], ["name"]);
});

test("a dirty node missing on the server becomes a pending create", () => {
  const dirty = createDiagramDirty();
  markNodeField(dirty, "user", "position");
  const local = diagram([node("user", { position: { x: 9, y: 9 } })]);
  syncDirtyWithRemote(dirty, diagram([]));
  const patch = buildDiagramPatch(local, dirty);
  assert.equal(dirty.pendingNodes.has("user"), true);
  assert.equal(patch.nodes?.[0]?.kind, "class");
  assert.equal(patch.nodes?.[0]?.name, "User");
  assert.deepEqual(patch.nodes?.[0]?.position, { x: 9, y: 9 });
  assert.deepEqual(patch.nodes?.[0]?.methods, ["login(): void"]);
});

test("a delete the server already applied is dropped", () => {
  const dirty = createDiagramDirty();
  dirty.deletedNodes.add("user");
  syncDirtyWithRemote(dirty, diagram([]));
  assert.equal(dirty.deletedNodes.has("user"), false);
});
