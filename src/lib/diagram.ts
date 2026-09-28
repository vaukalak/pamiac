import { z } from "zod";

export const UML_KINDS = [
  "class",
  "interface",
  "actor",
  "usecase",
  "package",
  "component",
  "note",
] as const;

export const UML_RELATIONS = [
  "association",
  "inheritance",
  "composition",
  "aggregation",
  "dependency",
  "realization",
] as const;

const umlNodeSchema = z.object({
  id: z.string().min(1).max(80),
  kind: z.enum(UML_KINDS),
  name: z.string().min(1).max(120),
  stereotype: z.string().max(80).optional(),
  attributes: z.array(z.string().max(200)).max(40).default([]),
  methods: z.array(z.string().max(200)).max(40).default([]),
  body: z.string().max(2000).optional(),
  position: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .optional(),
});

const umlRelationSchema = z.object({
  id: z.string().min(1).max(80),
  from: z.string().min(1).max(80),
  to: z.string().min(1).max(80),
  type: z.enum(UML_RELATIONS),
  label: z.string().max(120).optional(),
});

export const diagramSchema = z.object({
  nodes: z.array(umlNodeSchema).max(200),
  relations: z.array(umlRelationSchema).max(400),
});

export type UmlKind = (typeof UML_KINDS)[number];
export type UmlRelationType = (typeof UML_RELATIONS)[number];
export type UmlNode = z.infer<typeof umlNodeSchema>;
export type UmlRelation = z.infer<typeof umlRelationSchema>;
export type DiagramContent = z.infer<typeof diagramSchema>;

export function emptyDiagram(): DiagramContent {
  return { nodes: [], relations: [] };
}

export function gridPosition(index: number): { x: number; y: number } {
  const column = index % 4;
  const row = Math.floor(index / 4);
  return { x: 48 + column * 300, y: 48 + row * 230 };
}

function slugId(name: string, used: Set<string>): string {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "node";
  let id = base;
  let suffix = 2;
  while (used.has(id)) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }
  used.add(id);
  return id;
}

export function normalizeDiagram(input: unknown, previous?: DiagramContent): DiagramContent {
  const parsed = diagramSchema.parse(input);
  const previousPositions = new Map(
    (previous?.nodes ?? []).map((node) => [node.id, node.position] as const),
  );
  const nodes = parsed.nodes.map((node, index) => ({
    ...node,
    attributes: node.attributes ?? [],
    methods: node.methods ?? [],
    position: node.position ?? previousPositions.get(node.id) ?? gridPosition(index),
  }));
  const ids = new Set(nodes.map((node) => node.id));
  const relations = parsed.relations.filter(
    (relation) => ids.has(relation.from) && ids.has(relation.to),
  );
  return { nodes, relations };
}

export function diagramToText(diagram: DiagramContent): string {
  const blocks = diagram.nodes.map((node) => {
    const lines = [`${node.kind} ${node.name}`];
    if (node.stereotype) lines.push(`  stereotype: ${node.stereotype}`);
    if (node.attributes.length) {
      lines.push("  attributes:");
      for (const attribute of node.attributes) lines.push(`    ${attribute}`);
    }
    if (node.methods.length) {
      lines.push("  methods:");
      for (const method of node.methods) lines.push(`    ${method}`);
    }
    if (node.body) lines.push(`  note: ${node.body}`);
    return lines.join("\n");
  });
  const links = diagram.relations.map((relation) => {
    const label = relation.label ? ` : ${relation.label}` : "";
    return `${relation.from} --${relation.type}--> ${relation.to}${label}`;
  });
  return [...blocks, ...links].join("\n\n").trim();
}

export function ensureNodeIds(input: {
  nodes: Array<Partial<UmlNode> & { name: string; kind: UmlKind }>;
  relations: Array<Partial<UmlRelation> & { from: string; to: string; type: UmlRelationType }>;
}): DiagramContent {
  const used = new Set<string>();
  const nodes = input.nodes.map((node, index) => {
    const id = node.id && !used.has(node.id) ? node.id : slugId(node.name, used);
    if (node.id) used.add(id);
    return {
      id,
      kind: node.kind,
      name: node.name,
      stereotype: node.stereotype,
      attributes: node.attributes ?? [],
      methods: node.methods ?? [],
      body: node.body,
      position: node.position ?? gridPosition(index),
    };
  });
  const nameToId = new Map(nodes.map((node) => [node.name, node.id]));
  const relations = input.relations.map((relation, index) => ({
    id: relation.id || `rel-${index + 1}`,
    from: nameToId.get(relation.from) ?? relation.from,
    to: nameToId.get(relation.to) ?? relation.to,
    type: relation.type,
    label: relation.label,
  }));
  return normalizeDiagram({ nodes, relations });
}
