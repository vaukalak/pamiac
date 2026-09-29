import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { UML_KINDS, parseDiagram } from "./diagram.ts";
import { PALETTE_GROUPS, blankNodeData } from "./diagram-palette.ts";

const previousKinds = ["class", "interface", "actor", "usecase", "package", "component", "note"];

test("palette groups keep their labels and order", () => {
  assert.deepEqual(
    PALETTE_GROUPS.map((group) => group.label),
    ["Entity relationship", "Flow chart", "Org chart", "Sequence diagram"],
  );
  assert.deepEqual(
    PALETTE_GROUPS.map((group) => group.id),
    ["entity-relationship", "flow-chart", "org-chart", "sequence-diagram"],
  );
});

test("entity relationship is the only group open by default", () => {
  assert.deepEqual(
    PALETTE_GROUPS.filter((group) => group.open).map((group) => group.id),
    ["entity-relationship"],
  );
  assert.equal(PALETTE_GROUPS.length, 4);
});

test("each palette kind is in UML_KINDS once and previous kinds remain", () => {
  const seen = new Map<string, string>();
  for (const group of PALETTE_GROUPS) {
    for (const item of group.kinds) {
      assert.equal(seen.has(item.id), false, item.id);
      seen.set(item.id, group.id);
      assert.ok(
        (UML_KINDS as readonly string[]).includes(item.id),
        `${item.id} missing from UML_KINDS`,
      );
    }
  }
  assert.deepEqual([...seen.keys()].sort(), [...UML_KINDS].sort());
  for (const kind of previousKinds) {
    assert.ok((UML_KINDS as readonly string[]).includes(kind), kind);
    assert.ok(seen.has(kind), kind);
  }
  assert.deepEqual(
    PALETTE_GROUPS.map((group) => group.kinds.map((item) => [item.id, item.label])),
    [
      [
        ["class", "Class"],
        ["interface", "Interface"],
        ["component", "Component"],
        ["package", "Package"],
        ["entity", "Entity"],
        ["attribute", "Attribute"],
        ["relationship", "Relationship"],
      ],
      [
        ["terminator", "Terminator"],
        ["process", "Process"],
        ["decision", "Decision"],
        ["data", "Data"],
        ["document", "Document"],
        ["database", "Database"],
        ["usecase", "Use case"],
      ],
      [
        ["person", "Person"],
        ["role", "Role"],
        ["department", "Department"],
      ],
      [
        ["actor", "Actor"],
        ["participant", "Participant"],
        ["activation", "Activation"],
        ["fragment", "Fragment"],
        ["note", "Note"],
      ],
    ],
  );
});

test("parseDiagram accepts a decision, a person, and an older class", () => {
  const diagram = parseDiagram({
    nodes: [
      { kind: "class", name: "User" },
      { kind: "decision", name: "Ready?" },
      { kind: "person", name: "Ada" },
    ],
    relations: [],
  });
  assert.deepEqual(
    diagram.nodes.map((node) => node.kind),
    ["class", "decision", "person"],
  );
});

test("blank nodes keep compartments, the interface stereotype, and the note", () => {
  for (const kind of ["class", "interface", "component", "entity"] as const) {
    assert.deepEqual(blankNodeData(kind).attributes, ["id: string"]);
    assert.deepEqual(blankNodeData(kind).methods, []);
  }
  assert.equal(blankNodeData("interface").stereotype, "interface");
  assert.equal(blankNodeData("class").stereotype, undefined);
  assert.equal(blankNodeData("note").body, "Write a note");
  assert.equal(blankNodeData("note").name, "Note");
  const decision = blankNodeData("decision");
  assert.equal(decision.name, "Decision");
  assert.deepEqual(decision.attributes, []);
  assert.equal(decision.body, undefined);
  assert.equal(decision.stereotype, undefined);
  assert.equal(blankNodeData("person").name, "Person");
});

test("agent catalog lists kinds from UML_KINDS", () => {
  const source = readFileSync(new URL("../app/api/agent/v1/route.ts", import.meta.url), "utf8");
  assert.match(source, /UML_KINDS\.join\(" \| "\)/);
});

test("summary Space stops propagation and does not assign details.open", () => {
  const source = readFileSync(
    new URL("../components/diagram/palette-group.tsx", import.meta.url),
    "utf8",
  );
  const summary = source.slice(source.indexOf("<summary"), source.indexOf("</summary>"));
  assert.match(summary, /onKeyDown=/);
  assert.match(source, /stopPropagation\(\)/);
  assert.match(source, /"Space"/);
  assert.doesNotMatch(source, /details\.open/);
  assert.doesNotMatch(source, /\.open\s*=/);
  assert.doesNotMatch(source, /preventDefault\(/);
});

test("activation bar uses a fixed height instead of filling its parent", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const start = css.indexOf(".uml-card.kind-activation {");
  const end = css.indexOf(".uml-card.kind-fragment", start);
  const block = css.slice(start, end);
  assert.match(block, /height:\s*104px/);
  assert.match(block, /max-height:\s*104px/);
  assert.doesNotMatch(block, /height:\s*100%/);
});
