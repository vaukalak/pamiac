import type { DiagramContent, UmlNode, UmlRelation } from "./diagram.ts";
import { DIAGRAM_NODE_FIELDS, type DiagramNodeField } from "./diagram-patch.ts";

export type DiagramDirtyState = {
  nodeFields: Record<string, DiagramNodeField[]>;
  pendingNodeIds: string[];
  deletedNodeIds: string[];
  pendingRelationIds: string[];
  deletedRelationIds: string[];
};

function fieldSet(fields: DiagramNodeField[] | undefined) {
  return new Set(fields ?? []);
}

function mergeNode(local: UmlNode, remote: UmlNode, fields: Set<DiagramNodeField>): UmlNode {
  const next = { ...remote, attributes: [...remote.attributes], methods: [...remote.methods] };
  for (const field of DIAGRAM_NODE_FIELDS) {
    if (!fields.has(field)) continue;
    if (field === "attributes") next.attributes = [...local.attributes];
    else if (field === "methods") next.methods = [...local.methods];
    else if (field === "position")
      next.position = local.position ? { ...local.position } : undefined;
    else if (field === "kind") next.kind = local.kind;
    else if (field === "name") next.name = local.name;
    else if (field === "stereotype") next.stereotype = local.stereotype;
    else next.body = local.body;
  }
  return next;
}

export function mergeRemoteDiagram(
  local: DiagramContent,
  remote: DiagramContent,
  dirty: DiagramDirtyState,
): DiagramContent {
  const deletedNodes = new Set(dirty.deletedNodeIds);
  const pendingNodes = new Set(dirty.pendingNodeIds);
  const deletedRelations = new Set(dirty.deletedRelationIds);
  const pendingRelations = new Set(dirty.pendingRelationIds);
  const localNodes = new Map(local.nodes.map((node) => [node.id, node]));
  const remoteNodeIds = new Set(remote.nodes.map((node) => node.id));
  const nodes: UmlNode[] = [];

  for (const remoteNode of remote.nodes) {
    if (deletedNodes.has(remoteNode.id)) continue;
    const localNode = localNodes.get(remoteNode.id);
    if (!localNode) {
      nodes.push(remoteNode);
      continue;
    }
    if (pendingNodes.has(remoteNode.id)) {
      nodes.push(localNode);
      continue;
    }
    const fields = fieldSet(dirty.nodeFields[remoteNode.id]);
    nodes.push(fields.size ? mergeNode(localNode, remoteNode, fields) : remoteNode);
  }

  for (const localNode of local.nodes) {
    if (remoteNodeIds.has(localNode.id) || deletedNodes.has(localNode.id)) continue;
    const fields = dirty.nodeFields[localNode.id] ?? [];
    if (pendingNodes.has(localNode.id) || fields.length > 0) nodes.push(localNode);
  }

  const localRelations = new Map(local.relations.map((relation) => [relation.id, relation]));
  const remoteRelationIds = new Set(remote.relations.map((relation) => relation.id));
  const relations: UmlRelation[] = [];

  for (const remoteRelation of remote.relations) {
    if (deletedRelations.has(remoteRelation.id)) continue;
    const localRelation = localRelations.get(remoteRelation.id);
    if (pendingRelations.has(remoteRelation.id) && localRelation) {
      relations.push(localRelation);
      continue;
    }
    const fromGone = !nodes.some((node) => node.id === remoteRelation.from);
    const toGone = !nodes.some((node) => node.id === remoteRelation.to);
    if (fromGone || toGone) continue;
    relations.push(remoteRelation);
  }

  for (const localRelation of local.relations) {
    if (remoteRelationIds.has(localRelation.id) || deletedRelations.has(localRelation.id)) continue;
    if (pendingRelations.has(localRelation.id)) relations.push(localRelation);
  }

  return { nodes, relations };
}
