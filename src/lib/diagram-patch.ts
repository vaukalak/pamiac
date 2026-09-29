import { z } from "zod";
import {
  UML_KINDS,
  UML_RELATIONS,
  gridPosition,
  normalizeDiagram,
  type DiagramContent,
  type UmlNode,
  type UmlRelation,
} from "./diagram.ts";

export const DIAGRAM_NODE_FIELDS = [
  "kind",
  "name",
  "stereotype",
  "attributes",
  "methods",
  "body",
  "position",
] as const;

export type DiagramNodeField = (typeof DIAGRAM_NODE_FIELDS)[number];

const nodePatchSchema = z.object({
  id: z.string().min(1).max(80),
  kind: z.enum(UML_KINDS).optional(),
  name: z.string().min(1).max(120).optional(),
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

const relationPatchSchema = z.object({
  id: z.string().min(1).max(80),
  from: z.string().min(1).max(80),
  to: z.string().min(1).max(80),
  type: z.enum(UML_RELATIONS),
  label: z.string().max(120).optional(),
});

export const diagramPatchSchema = z.object({
  nodes: z.array(nodePatchSchema).max(200).optional(),
  deleteNodes: z.array(z.string().min(1).max(80)).max(200).optional(),
  relations: z.array(relationPatchSchema).max(400).optional(),
  deleteRelations: z.array(z.string().min(1).max(80)).max(400).optional(),
});

export type DiagramNodePatch = z.infer<typeof nodePatchSchema>;
export type DiagramRelationPatch = z.infer<typeof relationPatchSchema>;
export type DiagramPatch = z.infer<typeof diagramPatchSchema>;

function cleanLines(lines: string[]) {
  return lines.map((line) => line.trim()).filter(Boolean);
}

function copyNode(node: UmlNode): UmlNode {
  return {
    ...node,
    attributes: [...node.attributes],
    methods: [...node.methods],
    position: node.position ? { ...node.position } : undefined,
  };
}

function resolveEnd(value: string, nodes: UmlNode[], relationId: string) {
  if (nodes.some((node) => node.id === value)) return value;
  const matches = nodes.filter((node) => node.name === value);
  if (matches.length === 1) return matches[0].id;
  throw new Error(`Relation ${relationId} references a missing element`);
}

function applyNodePatch(nodes: UmlNode[], patchNode: DiagramNodePatch) {
  const index = nodes.findIndex((node) => node.id === patchNode.id);
  if (index === -1) {
    if (!patchNode.kind || !patchNode.name) {
      throw new Error(`Node ${patchNode.id} needs a kind and a name`);
    }
    nodes.push({
      id: patchNode.id,
      kind: patchNode.kind,
      name: patchNode.name,
      stereotype: patchNode.stereotype || undefined,
      attributes: cleanLines(patchNode.attributes ?? []),
      methods: cleanLines(patchNode.methods ?? []),
      body: patchNode.body || undefined,
      position: patchNode.position ?? gridPosition(nodes.length),
    });
    return;
  }
  const existing = nodes[index];
  nodes[index] = {
    ...existing,
    ...(patchNode.kind !== undefined ? { kind: patchNode.kind } : {}),
    ...(patchNode.name !== undefined ? { name: patchNode.name } : {}),
    ...(patchNode.stereotype !== undefined
      ? { stereotype: patchNode.stereotype || undefined }
      : {}),
    ...(patchNode.attributes !== undefined ? { attributes: cleanLines(patchNode.attributes) } : {}),
    ...(patchNode.methods !== undefined ? { methods: cleanLines(patchNode.methods) } : {}),
    ...(patchNode.body !== undefined ? { body: patchNode.body || undefined } : {}),
    ...(patchNode.position !== undefined ? { position: { ...patchNode.position } } : {}),
  };
}

function applyRelationPatch(
  relations: UmlRelation[],
  nodes: UmlNode[],
  patch: DiagramRelationPatch,
) {
  const from = resolveEnd(patch.from, nodes, patch.id);
  const to = resolveEnd(patch.to, nodes, patch.id);
  const index = relations.findIndex((relation) => relation.id === patch.id);
  if (index === -1) {
    relations.push({
      id: patch.id,
      from,
      to,
      type: patch.type,
      label: patch.label || undefined,
    });
    return;
  }
  const existing = relations[index];
  relations[index] = {
    ...existing,
    from,
    to,
    type: patch.type,
    label: patch.label !== undefined ? patch.label || undefined : existing.label,
  };
}

export function applyDiagramPatch(current: DiagramContent, patch: DiagramPatch): DiagramContent {
  const parsed = diagramPatchSchema.parse(patch);
  const deletedNodes = new Set(parsed.deleteNodes ?? []);
  const nodes = current.nodes.filter((node) => !deletedNodes.has(node.id)).map(copyNode);
  const relations = current.relations
    .filter(
      (relation) =>
        !deletedNodes.has(relation.from) &&
        !deletedNodes.has(relation.to) &&
        !(parsed.deleteRelations ?? []).includes(relation.id),
    )
    .map((relation) => ({ ...relation }));

  for (const patchNode of parsed.nodes ?? []) applyNodePatch(nodes, patchNode);
  for (const patchRelation of parsed.relations ?? []) {
    applyRelationPatch(relations, nodes, patchRelation);
  }

  return normalizeDiagram({ nodes, relations });
}
