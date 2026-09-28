import assert from "node:assert/strict";
import test from "node:test";
import { diagramToText, ensureNodeIds, normalizeDiagram } from "./diagram.ts";

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
