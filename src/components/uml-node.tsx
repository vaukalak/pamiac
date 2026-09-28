"use client";

import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import type { UmlKind } from "@/lib/diagram";

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
      <circle cx="27" cy="10" r="8" fill="none" stroke="#1a1814" strokeWidth="1.6" />
      <path
        d="M27 18 v22 M12 30 h30 M27 40 l-12 24 M27 40 l12 24"
        fill="none"
        stroke="#1a1814"
        strokeWidth="1.6"
      />
    </svg>
  );
}

export function UmlNodeView({ data, selected }: NodeProps<UmlFlowNode>) {
  const showCompartments =
    data.kind === "class" || data.kind === "interface" || data.kind === "component";
  return (
    <div className={`uml-card kind-${data.kind}${selected ? " is-selected" : ""}`}>
      <Handle type="target" position={Position.Top} />
      <Handle type="target" position={Position.Left} id="left" />
      {data.kind === "actor" ? <ActorFigure /> : null}
      <header>
        {data.stereotype || data.kind === "interface" ? (
          <span className="stereo">«{data.stereotype || data.kind}»</span>
        ) : null}
        <div className="name">{data.name}</div>
      </header>
      {showCompartments ? (
        <>
          <ul>
            {data.attributes.length ? (
              data.attributes.map((line) => <li key={line}>{line}</li>)
            ) : (
              <li>&nbsp;</li>
            )}
          </ul>
          <ul>
            {data.methods.length ? (
              data.methods.map((line) => <li key={line}>{line}</li>)
            ) : (
              <li>&nbsp;</li>
            )}
          </ul>
        </>
      ) : null}
      {data.kind === "note" && data.body ? <div className="body">{data.body}</div> : null}
      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Right} id="right" />
    </div>
  );
}

export const umlNodeTypes = { uml: UmlNodeView };
