"use client";

import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type OnConnect,
} from "@xyflow/react";
import { useEffect, useRef, useState } from "react";
import "@xyflow/react/dist/style.css";
import {
  UML_KINDS,
  UML_RELATIONS,
  parseDiagram,
  type DiagramContent,
  type UmlKind,
  type UmlRelationType,
} from "@/lib/diagram";
import { UmlNodeView, type UmlFlowNode, type UmlNodeData } from "@/components/uml-node";

const nodeTypes = { uml: UmlNodeView };

const KIND_LABEL: Record<UmlKind, string> = {
  class: "Class",
  interface: "Interface",
  actor: "Actor",
  participant: "Participant",
  activation: "Activation",
  usecase: "Use case",
  package: "Package",
  component: "Component",
  note: "Note",
};

function edgeAppearance(type: UmlRelationType) {
  const dashed = type === "dependency" || type === "realization";
  const style = {
    stroke: "var(--uml-ink)",
    strokeWidth: 1.6,
    strokeDasharray: dashed ? "6 4" : undefined,
  };
  if (type === "inheritance" || type === "realization")
    return { style, markerEnd: "url(#uml-triangle)" };
  if (type === "composition") {
    return { style, markerStart: "url(#uml-diamond)", markerEnd: "url(#uml-arrow)" };
  }
  if (type === "aggregation") {
    return { style, markerStart: "url(#uml-diamond-open)", markerEnd: "url(#uml-arrow)" };
  }
  return { style, markerEnd: "url(#uml-arrow)" };
}

function toFlow(diagram: DiagramContent): { nodes: UmlFlowNode[]; edges: Edge[] } {
  return {
    nodes: diagram.nodes.map((node) => ({
      id: node.id,
      type: "uml",
      position: node.position ?? { x: 0, y: 0 },
      data: {
        kind: node.kind,
        name: node.name,
        stereotype: node.stereotype,
        attributes: node.attributes,
        methods: node.methods,
        body: node.body,
      },
    })),
    edges: diagram.relations.map((relation) => ({
      id: relation.id,
      source: relation.from,
      target: relation.to,
      label: relation.label,
      data: { relationType: relation.type },
      type: "smoothstep",
      ...edgeAppearance(relation.type),
    })),
  };
}

function toDiagram(nodes: UmlFlowNode[], edges: Edge[]): DiagramContent {
  const ids = new Set(nodes.map((node) => node.id));
  return parseDiagram({
    nodes: nodes.map((node) => ({
      id: node.id,
      ...node.data,
      attributes: node.data.attributes.filter((line) => line.trim()),
      methods: node.data.methods.filter((line) => line.trim()),
      position: node.position,
    })),
    relations: edges
      .filter((edge) => ids.has(edge.source) && ids.has(edge.target))
      .map((edge) => ({
        id: edge.id,
        from: edge.source,
        to: edge.target,
        type: (edge.data?.relationType as UmlRelationType) ?? "association",
        label: typeof edge.label === "string" && edge.label ? edge.label : undefined,
      })),
  });
}

function blankData(kind: UmlKind): UmlNodeData {
  const structured = kind === "class" || kind === "interface" || kind === "component";
  return {
    kind,
    name: KIND_LABEL[kind],
    attributes: structured ? ["id: string"] : [],
    methods: structured ? [] : [],
    body: kind === "note" ? "Write a note" : undefined,
    stereotype: kind === "interface" ? "interface" : undefined,
  };
}

export function UmlEditor({
  initial,
  editable,
  onChange,
}: {
  initial: string;
  editable: boolean;
  onChange: (diagram: DiagramContent) => void;
}) {
  return (
    <ReactFlowProvider>
      <UmlCanvas editable={editable} initial={initial} onChange={onChange} />
    </ReactFlowProvider>
  );
}

function UmlCanvas({
  initial,
  editable,
  onChange,
}: {
  initial: string;
  editable: boolean;
  onChange: (diagram: DiagramContent) => void;
}) {
  const starting = toFlow(
    parseDiagram(initial ? JSON.parse(initial) : { nodes: [], relations: [] }),
  );
  const [nodes, setNodes, onNodesChange] = useNodesState<UmlFlowNode>(starting.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(starting.edges);
  const [relationType, setRelationType] = useState<UmlRelationType>("association");
  const { screenToFlowPosition } = useReactFlow();
  const lastSerialized = useRef("");

  useEffect(() => {
    const diagram = toDiagram(nodes, edges);
    const serialized = JSON.stringify(diagram);
    if (serialized === lastSerialized.current) return;
    if (!lastSerialized.current) {
      lastSerialized.current = serialized;
      return;
    }
    lastSerialized.current = serialized;
    onChange(diagram);
  }, [nodes, edges, onChange]);

  const onConnect: OnConnect = (connection: Connection) => {
    if (
      !editable ||
      !connection.source ||
      !connection.target ||
      connection.source === connection.target
    )
      return;
    setEdges((current) =>
      addEdge(
        {
          ...connection,
          id: crypto.randomUUID(),
          type: "smoothstep",
          data: { relationType },
          ...edgeAppearance(relationType),
        },
        current,
      ),
    );
  };

  function addNode(kind: UmlKind, position: { x: number; y: number }) {
    const node: UmlFlowNode = {
      id: crypto.randomUUID(),
      type: "uml",
      position,
      data: blankData(kind),
    };
    setNodes((current) => [...current, node]);
  }

  const selectedNode = nodes.find((node) => node.selected);
  const selectedEdge = edges.find((edge) => edge.selected);

  function updateSelected(patch: Partial<UmlNodeData>) {
    if (!selectedNode) return;
    setNodes((current) =>
      current.map((node) =>
        node.id === selectedNode.id ? { ...node, data: { ...node.data, ...patch } } : node,
      ),
    );
  }

  return (
    <div className="uml-layout">
      <aside className="palette">
        <h3>Elements</h3>
        {UML_KINDS.map((kind) => (
          <button
            draggable={editable}
            key={kind}
            onClick={() =>
              editable && addNode(kind, { x: 80 + nodes.length * 24, y: 80 + nodes.length * 16 })
            }
            onDragStart={(event) => {
              event.dataTransfer.setData("application/pamiac-uml", kind);
              event.dataTransfer.effectAllowed = "move";
            }}
            type="button"
          >
            {KIND_LABEL[kind]}
          </button>
        ))}
        <h3>Relation</h3>
        <div className="rel-picker">
          {UML_RELATIONS.map((type) => (
            <button
              className={relationType === type ? "active" : ""}
              key={type}
              onClick={() => setRelationType(type)}
              type="button"
            >
              {type}
            </button>
          ))}
        </div>
        {editable ? (
          <button
            onClick={() =>
              setNodes((current) =>
                current.map((node, index) => ({
                  ...node,
                  position: { x: 40 + (index % 3) * 280, y: 40 + Math.floor(index / 3) * 220 },
                })),
              )
            }
            type="button"
          >
            Arrange
          </button>
        ) : null}
      </aside>
      <div
        className="canvas-wrap"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          if (!editable) return;
          const kind = event.dataTransfer.getData("application/pamiac-uml") as UmlKind;
          if (!UML_KINDS.includes(kind)) return;
          addNode(kind, screenToFlowPosition({ x: event.clientX, y: event.clientY }));
        }}
      >
        {nodes.length === 0 ? (
          <div className="canvas-empty">Drag a class, actor, or note onto the canvas.</div>
        ) : null}
        <svg width="0" height="0" style={{ position: "absolute" }}>
          <defs>
            <marker
              id="uml-arrow"
              markerHeight="8"
              markerWidth="8"
              orient="auto-start-reverse"
              refX="8"
              refY="4"
              viewBox="0 0 8 8"
            >
              <path d="M0 0 L8 4 L0 8" fill="none" stroke="var(--uml-ink)" />
            </marker>
            <marker
              id="uml-triangle"
              markerHeight="12"
              markerWidth="12"
              orient="auto-start-reverse"
              refX="12"
              refY="6"
              viewBox="0 0 12 12"
            >
              <path d="M0 0 L12 6 L0 12 Z" fill="var(--uml-fill)" stroke="var(--uml-ink)" />
            </marker>
            <marker
              id="uml-diamond"
              markerHeight="12"
              markerWidth="16"
              orient="auto-start-reverse"
              refX="0"
              refY="6"
              viewBox="0 0 16 12"
            >
              <path d="M0 6 L8 0 L16 6 L8 12 Z" fill="var(--uml-ink)" />
            </marker>
            <marker
              id="uml-diamond-open"
              markerHeight="12"
              markerWidth="16"
              orient="auto-start-reverse"
              refX="0"
              refY="6"
              viewBox="0 0 16 12"
            >
              <path d="M0 6 L8 0 L16 6 L8 12 Z" fill="var(--uml-fill)" stroke="var(--uml-ink)" />
            </marker>
          </defs>
        </svg>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          deleteKeyCode={editable ? ["Backspace", "Delete"] : null}
          nodesDraggable={editable}
          nodesConnectable={editable}
          elementsSelectable
          colorMode="system"
        >
          <Background color="var(--flow-grid)" gap={22} />
          <Controls />
          <MiniMap pannable zoomable />
        </ReactFlow>
      </div>
      <aside className="inspector">
        <h3>Inspector</h3>
        {selectedNode ? (
          <div className="form-stack">
            <div>
              <label htmlFor="uml-name">Name</label>
              <input
                id="uml-name"
                disabled={!editable}
                value={selectedNode.data.name}
                onChange={(event) => updateSelected({ name: event.target.value || "Untitled" })}
              />
            </div>
            <div>
              <label htmlFor="uml-stereo">Stereotype</label>
              <input
                id="uml-stereo"
                disabled={!editable}
                value={selectedNode.data.stereotype ?? ""}
                onChange={(event) =>
                  updateSelected({ stereotype: event.target.value || undefined })
                }
              />
            </div>
            {selectedNode.data.kind === "class" ||
            selectedNode.data.kind === "interface" ||
            selectedNode.data.kind === "component" ? (
              <>
                <div>
                  <label htmlFor="uml-attrs">Attributes</label>
                  <textarea
                    id="uml-attrs"
                    disabled={!editable}
                    value={selectedNode.data.attributes.join("\n")}
                    onChange={(event) =>
                      updateSelected({ attributes: event.target.value.split("\n") })
                    }
                  />
                </div>
                <div>
                  <label htmlFor="uml-methods">Methods</label>
                  <textarea
                    id="uml-methods"
                    disabled={!editable}
                    value={selectedNode.data.methods.join("\n")}
                    onChange={(event) =>
                      updateSelected({ methods: event.target.value.split("\n") })
                    }
                  />
                </div>
              </>
            ) : null}
            {selectedNode.data.kind === "note" ? (
              <div>
                <label htmlFor="uml-body">Note</label>
                <textarea
                  id="uml-body"
                  disabled={!editable}
                  value={selectedNode.data.body ?? ""}
                  onChange={(event) => updateSelected({ body: event.target.value })}
                />
              </div>
            ) : null}
            <p className="hint">One attribute or method per line. Drag from a handle to connect.</p>
          </div>
        ) : selectedEdge ? (
          <div className="form-stack">
            <div>
              <label htmlFor="edge-label">Label</label>
              <input
                id="edge-label"
                disabled={!editable}
                value={typeof selectedEdge.label === "string" ? selectedEdge.label : ""}
                onChange={(event) =>
                  setEdges((current) =>
                    current.map((edge) =>
                      edge.id === selectedEdge.id ? { ...edge, label: event.target.value } : edge,
                    ),
                  )
                }
              />
            </div>
            <div>
              <label htmlFor="edge-type">Type</label>
              <select
                id="edge-type"
                disabled={!editable}
                value={(selectedEdge.data?.relationType as UmlRelationType) ?? "association"}
                onChange={(event) => {
                  const type = event.target.value as UmlRelationType;
                  setEdges((current) =>
                    current.map((edge) =>
                      edge.id === selectedEdge.id
                        ? { ...edge, data: { relationType: type }, ...edgeAppearance(type) }
                        : edge,
                    ),
                  );
                }}
              >
                {UML_RELATIONS.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <p className="hint">Select an element to edit its name, attributes, and methods.</p>
        )}
      </aside>
    </div>
  );
}
