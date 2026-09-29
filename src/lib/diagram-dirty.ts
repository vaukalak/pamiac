import type { DiagramContent, UmlNode, UmlRelation } from "./diagram.ts";
import {
  DIAGRAM_NODE_FIELDS,
  type DiagramNodeField,
  type DiagramPatch,
  type DiagramRelationPatch,
} from "./diagram-patch.ts";
import { type DiagramDirtyState } from "./diagram-merge.ts";

export type DiagramDirty = {
  nodeFields: Map<string, Set<DiagramNodeField>>;
  pendingNodes: Set<string>;
  deletedNodes: Set<string>;
  pendingRelations: Set<string>;
  deletedRelations: Set<string>;
};

export function createDiagramDirty(): DiagramDirty {
  return {
    nodeFields: new Map(),
    pendingNodes: new Set(),
    deletedNodes: new Set(),
    pendingRelations: new Set(),
    deletedRelations: new Set(),
  };
}

export function isDiagramDirty(dirty: DiagramDirty) {
  return (
    dirty.nodeFields.size > 0 ||
    dirty.pendingNodes.size > 0 ||
    dirty.deletedNodes.size > 0 ||
    dirty.pendingRelations.size > 0 ||
    dirty.deletedRelations.size > 0
  );
}

export function dirtyState(dirty: DiagramDirty): DiagramDirtyState {
  return {
    nodeFields: Object.fromEntries([...dirty.nodeFields].map(([id, fields]) => [id, [...fields]])),
    pendingNodeIds: [...dirty.pendingNodes],
    deletedNodeIds: [...dirty.deletedNodes],
    pendingRelationIds: [...dirty.pendingRelations],
    deletedRelationIds: [...dirty.deletedRelations],
  };
}

export function markNodeField(dirty: DiagramDirty, id: string, field: DiagramNodeField) {
  if (dirty.deletedNodes.has(id)) return;
  const fields = dirty.nodeFields.get(id) ?? new Set<DiagramNodeField>();
  fields.add(field);
  dirty.nodeFields.set(id, fields);
}

export function markNodeDeleted(dirty: DiagramDirty, id: string) {
  dirty.pendingNodes.delete(id);
  dirty.nodeFields.delete(id);
  dirty.deletedNodes.add(id);
}

export function markRelationDeleted(dirty: DiagramDirty, id: string) {
  dirty.pendingRelations.delete(id);
  dirty.deletedRelations.add(id);
}

function cloneNode(node: UmlNode): UmlNode {
  return {
    ...node,
    attributes: [...node.attributes],
    methods: [...node.methods],
    position: node.position ? { ...node.position } : undefined,
  };
}

export function buildDiagramPatch(diagram: DiagramContent, dirty: DiagramDirty): DiagramPatch {
  const nodes = [];
  for (const id of dirty.pendingNodes) {
    if (dirty.deletedNodes.has(id)) continue;
    const node = diagram.nodes.find((item) => item.id === id);
    if (node) nodes.push(cloneNode(node));
  }
  for (const [id, fields] of dirty.nodeFields) {
    if (dirty.pendingNodes.has(id) || dirty.deletedNodes.has(id)) continue;
    const node = diagram.nodes.find((item) => item.id === id);
    if (!node) continue;
    const patch: { id: string } & Partial<UmlNode> = { id };
    for (const field of fields) {
      if (field === "attributes") patch.attributes = [...node.attributes];
      else if (field === "methods") patch.methods = [...node.methods];
      else if (field === "position")
        patch.position = node.position ? { ...node.position } : undefined;
      else if (field === "kind") patch.kind = node.kind;
      else if (field === "name") patch.name = node.name;
      else if (field === "stereotype") patch.stereotype = node.stereotype ?? "";
      else patch.body = node.body ?? "";
    }
    nodes.push(patch);
  }
  const relations = [];
  for (const id of dirty.pendingRelations) {
    if (dirty.deletedRelations.has(id)) continue;
    const relation = diagram.relations.find((item) => item.id === id);
    if (relation) relations.push({ ...relation });
  }
  return {
    nodes,
    deleteNodes: [...dirty.deletedNodes],
    relations,
    deleteRelations: [...dirty.deletedRelations],
  };
}

function sameValue(left: unknown, right: unknown) {
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
}

function sameField(field: DiagramNodeField, node: UmlNode, sent: Partial<UmlNode>) {
  if (field === "stereotype" || field === "body")
    return (node[field] ?? "") === (sent[field] ?? "");
  return sameValue(node[field], sent[field]);
}

function sameNode(node: UmlNode, sent: { id: string } & Partial<UmlNode>) {
  return DIAGRAM_NODE_FIELDS.every((field) => sameField(field, node, sent));
}

function sameRelation(relation: UmlRelation, sent: DiagramRelationPatch) {
  return (
    relation.from === sent.from &&
    relation.to === sent.to &&
    relation.type === sent.type &&
    (relation.label ?? "") === (sent.label ?? "")
  );
}

export function acknowledgePatch(dirty: DiagramDirty, sent: DiagramPatch, current: DiagramContent) {
  for (const nodePatch of sent.nodes ?? []) {
    const node = current.nodes.find((item) => item.id === nodePatch.id);
    if (!node) {
      dirty.pendingNodes.delete(nodePatch.id);
      dirty.nodeFields.delete(nodePatch.id);
      continue;
    }
    if (dirty.pendingNodes.has(nodePatch.id)) {
      if (sameNode(node, nodePatch)) {
        dirty.pendingNodes.delete(nodePatch.id);
        dirty.nodeFields.delete(nodePatch.id);
      }
      continue;
    }
    const fields = dirty.nodeFields.get(nodePatch.id);
    if (!fields) continue;
    for (const field of DIAGRAM_NODE_FIELDS) {
      if (!Object.prototype.hasOwnProperty.call(nodePatch, field)) continue;
      if (sameField(field, node, nodePatch)) fields.delete(field);
    }
    if (fields.size === 0) dirty.nodeFields.delete(nodePatch.id);
  }
  for (const id of sent.deleteNodes ?? []) {
    if (!current.nodes.some((node) => node.id === id)) dirty.deletedNodes.delete(id);
  }
  for (const relationPatch of sent.relations ?? []) {
    const relation = current.relations.find((item) => item.id === relationPatch.id);
    if (!relation || sameRelation(relation, relationPatch)) {
      dirty.pendingRelations.delete(relationPatch.id);
    }
  }
  for (const id of sent.deleteRelations ?? []) {
    if (!current.relations.some((relation) => relation.id === id)) {
      dirty.deletedRelations.delete(id);
    }
  }
}

export function syncDirtyWithRemote(dirty: DiagramDirty, remote: DiagramContent) {
  const nodeIds = new Set(remote.nodes.map((node) => node.id));
  for (const id of dirty.nodeFields.keys()) {
    if (!nodeIds.has(id)) dirty.pendingNodes.add(id);
  }
  for (const id of [...dirty.deletedNodes]) {
    if (!nodeIds.has(id)) dirty.deletedNodes.delete(id);
  }
  const relationIds = new Set(remote.relations.map((relation) => relation.id));
  for (const id of [...dirty.deletedRelations]) {
    if (!relationIds.has(id)) dirty.deletedRelations.delete(id);
  }
}
