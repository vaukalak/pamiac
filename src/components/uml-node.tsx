"use client";

import { Handle, Position, type Node } from "@xyflow/react";
import { NodeCompartments } from "@/components/diagram/node-compartments";
import { NodeHeading } from "@/components/diagram/node-heading";
import type { UmlKind } from "@/lib/diagram";
import { kindHasCompartments } from "@/lib/diagram-palette";

export type UmlNodeData = {
  kind: UmlKind;
  name: string;
  stereotype?: string;
  attributes: string[];
  methods: string[];
  body?: string;
};

export type UmlFlowNode = Node<UmlNodeData, "uml">;

function ActorFigure() {
  return (
    <svg width="54" height="72" viewBox="0 0 54 72" aria-hidden="true">
      <circle cx="27" cy="10" r="8" fill="none" stroke="var(--uml-ink)" strokeWidth="1.6" />
      <path
        d="M27 18 v22 M12 30 h30 M27 40 l-12 24 M27 40 l12 24"
        fill="none"
        stroke="var(--uml-ink)"
        strokeWidth="1.6"
      />
    </svg>
  );
}

interface Properties {
  data: UmlNodeData;
  selected?: boolean;
}

export function UmlNodeView(props: Properties) {
  const { data, selected } = props;

  return (
    <div className={`uml-card kind-${data.kind}${selected ? " is-selected" : ""}`}>
      <Handle type="target" position={Position.Top} />
      <Handle type="target" position={Position.Left} id="left" />
      {data.kind === "actor" ? <ActorFigure /> : null}
      <NodeHeading kind={data.kind} name={data.name} stereotype={data.stereotype} />
      {kindHasCompartments(data.kind) ? (
        <NodeCompartments attributes={data.attributes} methods={data.methods} />
      ) : null}
      {data.kind === "note" && data.body ? <div className="body">{data.body}</div> : null}
      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Right} id="right" />
    </div>
  );
}

export const umlNodeTypes = { uml: UmlNodeView };
