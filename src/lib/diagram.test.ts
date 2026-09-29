import assert from "node:assert/strict";
import test from "node:test";
import { diagramToText, ensureNodeIds, normalizeDiagram, parseDiagram } from "./diagram.ts";

test("keeps dragged positions when an agent updates the same node", () => {
  const previous = normalizeDiagram({
    nodes: [
      {
        id: "user",
        kind: "class",
        name: "User",
        attributes: ["id: string"],
        methods: [],
        position: { x: 420, y: 80 },
      },
    ],
    relations: [],
  });
  const next = normalizeDiagram(
    {
      nodes: [
        {
          id: "user",
          kind: "class",
          name: "User",
          attributes: ["id: string", "email: string"],
          methods: ["login(): void"],
        },
      ],
      relations: [],
    },
    previous,
  );
  assert.deepEqual(next.nodes[0]?.position, { x: 420, y: 80 });
  assert.equal(next.nodes[0]?.methods[0], "login(): void");
});

test("diagram text is readable for an agent", () => {
  const diagram = ensureNodeIds({
    nodes: [
      { kind: "class", name: "Order", attributes: ["total: number"], methods: ["pay(): void"] },
      { kind: "class", name: "Payment", attributes: [], methods: [] },
    ],
    relations: [{ from: "Order", to: "Payment", type: "composition", label: "charges" }],
  });
  const text = diagramToText(diagram);
  assert.match(text, /class Order/);
  assert.match(text, /order --composition--> payment : charges/);
});

const sequenceDocument = {
  nodes: [
    {
      id: "06849f8b-5222-4786-ab02-b979b76ebfc4",
      kind: "actor",
      name: "Actor",
      attributes: [],
      methods: [],
      position: { x: -3.5, y: -13.5 },
    },
    {
      id: "19abe90e-550c-4a3d-9e76-bfc6402f7c65",
      kind: "participant",
      name: "Mobile app",
      attributes: [],
      methods: [],
      position: { x: 83.75, y: -103.92 },
    },
    {
      id: "0f759111-7733-4f63-bd10-4137012a2883",
      kind: "activation",
      name: "Activation",
      attributes: [],
      methods: [],
      position: { x: 139.39, y: 28.49 },
    },
  ],
  relations: [],
};

test("parseDiagram keeps sequence participant and activation nodes", () => {
  const diagram = parseDiagram(sequenceDocument);
  assert.deepEqual(
    diagram.nodes.map((node) => ({
      id: node.id,
      kind: node.kind,
      name: node.name,
      position: node.position,
    })),
    sequenceDocument.nodes.map((node) => ({
      id: node.id,
      kind: node.kind,
      name: node.name,
      position: node.position,
    })),
  );
  assert.equal(diagram.nodes.length, 3);
});

test("diagram text names sequence participants and activations", () => {
  const text = diagramToText(parseDiagram(sequenceDocument));
  assert.match(text, /actor Actor/);
  assert.match(text, /participant Mobile app/);
  assert.match(text, /activation Activation/);
});

test("normalizeDiagram keeps a moved activation when the update omits position", () => {
  const previous = parseDiagram(sequenceDocument);
  const next = normalizeDiagram(
    {
      nodes: previous.nodes.map((node) =>
        node.kind === "activation" ? { ...node, name: "Login", position: undefined } : node,
      ),
      relations: [],
    },
    previous,
  );
  const activation = next.nodes.find((node) => node.kind === "activation");
  assert.equal(activation?.name, "Login");
  assert.deepEqual(activation?.position, { x: 139.39, y: 28.49 });
  assert.equal(next.nodes.length, 3);
});
