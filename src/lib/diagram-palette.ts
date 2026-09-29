import type { UmlKind } from "@/lib/diagram";

const COMPARTMENT_KINDS = ["class", "interface", "component", "entity"] as const;

type PaletteKind = {
  readonly id: UmlKind;
  readonly label: string;
};

type PaletteGroupShape = {
  readonly id: string;
  readonly label: string;
  readonly open: boolean;
  readonly kinds: readonly PaletteKind[];
};

export const PALETTE_GROUPS = [
  {
    id: "entity-relationship",
    label: "Entity relationship",
    open: true,
    kinds: [
      { id: "class", label: "Class" },
      { id: "interface", label: "Interface" },
      { id: "component", label: "Component" },
      { id: "package", label: "Package" },
      { id: "entity", label: "Entity" },
      { id: "attribute", label: "Attribute" },
      { id: "relationship", label: "Relationship" },
    ],
  },
  {
    id: "flow-chart",
    label: "Flow chart",
    open: false,
    kinds: [
      { id: "terminator", label: "Terminator" },
      { id: "process", label: "Process" },
      { id: "decision", label: "Decision" },
      { id: "data", label: "Data" },
      { id: "document", label: "Document" },
      { id: "database", label: "Database" },
      { id: "usecase", label: "Use case" },
    ],
  },
  {
    id: "org-chart",
    label: "Org chart",
    open: false,
    kinds: [
      { id: "person", label: "Person" },
      { id: "role", label: "Role" },
      { id: "department", label: "Department" },
    ],
  },
  {
    id: "sequence-diagram",
    label: "Sequence diagram",
    open: false,
    kinds: [
      { id: "actor", label: "Actor" },
      { id: "participant", label: "Participant" },
      { id: "activation", label: "Activation" },
      { id: "fragment", label: "Fragment" },
      { id: "note", label: "Note" },
    ],
  },
] as const satisfies readonly PaletteGroupShape[];

export type PaletteGroupDefinition = (typeof PALETTE_GROUPS)[number];

export type BlankNodeData = {
  kind: UmlKind;
  name: string;
  stereotype?: string;
  attributes: string[];
  methods: string[];
  body?: string;
};

export function kindLabel(kind: UmlKind): string {
  for (const group of PALETTE_GROUPS) {
    for (const item of group.kinds) {
      if (item.id === kind) return item.label;
    }
  }
  return kind;
}

export function kindHasCompartments(kind: UmlKind): boolean {
  return COMPARTMENT_KINDS.some((item) => item === kind);
}

export function blankNodeData(kind: UmlKind): BlankNodeData {
  return {
    kind,
    name: kindLabel(kind),
    attributes: kindHasCompartments(kind) ? ["id: string"] : [],
    methods: [],
    body: kind === "note" ? "Write a note" : undefined,
    stereotype: kind === "interface" ? "interface" : undefined,
  };
}
