"use client";

import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type OnConnect,
  type ReactFlowInstance,
} from "@xyflow/react";
import { useRef, useState } from "react";
import "@xyflow/react/dist/style.css";
import { DiagramPalette } from "@/components/diagram/diagram-palette";
import { useDiagramSync } from "@/components/diagram/use-diagram-sync";
import { InspectorCompartments } from "@/components/diagram/inspector-compartments";
import { UmlNodeView, type UmlFlowNode, type UmlNodeData } from "@/components/uml-node";
import { readDiagram } from "@/lib/content";
import {
  UML_KINDS,
  UML_RELATIONS,
  parseDiagram,
  type DiagramContent,
  type UmlKind,
  type UmlRelationType,
} from "@/lib/diagram";
import { blankNodeData, kindHasCompartments } from "@/lib/diagram-palette";
import {
  createDiagramDirty,
  markNodeDeleted,
  markNodeField,
  markRelationDeleted,
} from "@/lib/diagram-dirty";
import { DIAGRAM_NODE_FIELDS } from "@/lib/diagram-patch";
import { useThemeChoice } from "@/lib/use-theme-choice";

const nodeTypes = { uml: UmlNodeView };

interface Properties {
  id: string;
  initial: string;
  version: number;
  editable: boolean;
}

function edgeAppearance(type: UmlRelationType) {
  const dashed = type === "dependency" || type === "realization";
  const style = {
    stroke: "var(--uml-ink)",
    strokeWidth: 1.6,
    strokeDasharray: dashed ? "6 4" : undefined,
  };
  if (type === "inheritance" || type === "realization") {
    return { style, markerEnd: "url(#uml-triangle)" };
  }
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
      type: "uml" as const,
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
      type: "smoothstep" as const,
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

function applyDiagram(diagram: DiagramContent, currentNodes: UmlFlowNode[], currentEdges: Edge[]) {
  const nodeById = new Map(currentNodes.map((node) => [node.id, node]));
  const nodes: UmlFlowNode[] = diagram.nodes.map((node) => {
    const data: UmlNodeData = {
      kind: node.kind,
      name: node.name,
      stereotype: node.stereotype,
      attributes: node.attributes,
      methods: node.methods,
      body: node.body,
    };
    const existing = nodeById.get(node.id);
    if (!existing) {
      return {
        id: node.id,
        type: "uml" as const,
        position: node.position ?? { x: 0, y: 0 },
        data,
      };
    }
    return {
      ...existing,
      position: node.position ?? existing.position,
      data,
    };
  });
  const edgeById = new Map(currentEdges.map((edge) => [edge.id, edge]));
  const edges = diagram.relations.map((relation) => {
    const appearance = edgeAppearance(relation.type);
    const existing = edgeById.get(relation.id);
    if (!existing) {
      return {
        id: relation.id,
        source: relation.from,
        target: relation.to,
        label: relation.label,
        data: { relationType: relation.type },
        type: "smoothstep" as const,
        ...appearance,
      };
    }
    return {
      ...existing,
      source: relation.from,
      target: relation.to,
      label: relation.label,
      data: { relationType: relation.type },
      ...appearance,
    };
  });
  return { nodes, edges };
}

export function UmlCanvas(props: Properties) {
  const { id, initial, version, editable } = props;
  const choice = useThemeChoice();
  const starting = toFlow(readDiagram(initial));
  const [nodes, setNodes, onNodesChange] = useNodesState<UmlFlowNode>(starting.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(starting.edges);
  const [relationType, setRelationType] = useState<UmlRelationType>("association");
  const [hold, setHold] = useState(false);
  const { screenToFlowPosition } = useReactFlow();
  const dirty = useRef(createDiagramDirty()).current;
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const fitted = useRef(false);
  const dragOrigin = useRef<{ id: string; x: number; y: number } | null>(null);
  nodesRef.current = nodes;
  edgesRef.current = edges;

  const { schedule } = useDiagramSync({
    id,
    version,
    editable,
    hold,
    dirty,
    diagram: () => toDiagram(nodesRef.current, edgesRef.current),
    apply: (next) => {
      const flow = applyDiagram(next, nodesRef.current, edgesRef.current);
      setNodes(flow.nodes);
      setEdges(flow.edges);
    },
  });

  const onConnect: OnConnect = (connection: Connection) => {
    if (
      !editable ||
      !connection.source ||
      !connection.target ||
      connection.source === connection.target
    ) {
      return;
    }
    const relationId = crypto.randomUUID();
    dirty.pendingRelations.add(relationId);
    setEdges((current) =>
      addEdge(
        {
          ...connection,
          id: relationId,
          type: "smoothstep",
          data: { relationType },
          ...edgeAppearance(relationType),
        },
        current,
      ),
    );
    schedule();
  };

  function addNode(kind: UmlKind, position: { x: number; y: number }) {
    if (!editable) return;
    const node: UmlFlowNode = {
      id: crypto.randomUUID(),
      type: "uml",
      position,
      data: blankNodeData(kind),
    };
    dirty.pendingNodes.add(node.id);
    setNodes((current) => [...current, node]);
    schedule();
  }

  const selectedNode = nodes.find((node) => node.selected);
  const selectedEdge = edges.find((edge) => edge.selected);

  function updateSelected(patch: Partial<UmlNodeData>) {
    if (!editable || !selectedNode) return;
    const nodeId = selectedNode.id;
    setNodes((current) =>
      current.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...patch } } : node,
      ),
    );
    for (const field of DIAGRAM_NODE_FIELDS) {
      if (field !== "position" && field in patch) markNodeField(dirty, nodeId, field);
    }
    schedule();
  }

  function editSelectedRelation(patch: { label?: string; relationType?: UmlRelationType }) {
    if (!editable || !selectedEdge) return;
    const edgeId = selectedEdge.id;
    setEdges((current) =>
      current.map((edge) => {
        if (edge.id !== edgeId) return edge;
        const type = patch.relationType ?? (edge.data?.relationType as UmlRelationType);
        return {
          ...edge,
          ...("label" in patch ? { label: patch.label } : {}),
          ...(patch.relationType
            ? { data: { relationType: patch.relationType }, ...edgeAppearance(patch.relationType) }
            : { data: { relationType: type } }),
        };
      }),
    );
    dirty.pendingRelations.add(edgeId);
    schedule();
  }

  function fitOnce(instance: ReactFlowInstance<UmlFlowNode, Edge>) {
    if (fitted.current) return;
    fitted.current = true;
    void instance.fitView();
  }

  return (
    <div className="uml-layout">
      <DiagramPalette
        editable={editable}
        onAdd={(kind) => addNode(kind, { x: 80 + nodes.length * 24, y: 80 + nodes.length * 16 })}
        onArrange={() => {
          const next = nodes.map((node, index) => ({
            ...node,
            position: { x: 40 + (index % 3) * 280, y: 40 + Math.floor(index / 3) * 220 },
          }));
          for (const node of next) {
            if (!dirty.pendingNodes.has(node.id)) markNodeField(dirty, node.id, "position");
          }
          setNodes(next);
          schedule();
        }}
        onRelation={setRelationType}
        relationType={relationType}
      />
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
          <div className="canvas-empty">Drag an element from the palette onto the canvas.</div>
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
          onInit={fitOnce}
          onNodeDragStart={(_event, node) => {
            setHold(true);
            dragOrigin.current = { id: node.id, x: node.position.x, y: node.position.y };
          }}
          onNodeDragStop={(_event, node) => {
            setHold(false);
            const origin = dragOrigin.current;
            dragOrigin.current = null;
            if (!editable || !origin || origin.id !== node.id) return;
            if (origin.x === node.position.x && origin.y === node.position.y) return;
            if (!dirty.pendingNodes.has(node.id)) markNodeField(dirty, node.id, "position");
            schedule();
          }}
          onNodesDelete={(removed) => {
            if (!editable) return;
            const ids = new Set(removed.map((node) => node.id));
            for (const nodeId of ids) markNodeDeleted(dirty, nodeId);
            for (const edge of edgesRef.current) {
              if (ids.has(edge.source) || ids.has(edge.target)) markRelationDeleted(dirty, edge.id);
            }
            setEdges((current) =>
              current.filter((edge) => !ids.has(edge.source) && !ids.has(edge.target)),
            );
            schedule();
          }}
          onEdgesDelete={(removed) => {
            if (!editable) return;
            for (const edge of removed) markRelationDeleted(dirty, edge.id);
            schedule();
          }}
          deleteKeyCode={editable ? ["Backspace", "Delete"] : null}
          nodesDraggable={editable}
          nodesConnectable={editable}
          elementsSelectable
          colorMode={choice}
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
            {kindHasCompartments(selectedNode.data.kind) ? (
              <InspectorCompartments
                attributes={selectedNode.data.attributes}
                editable={editable}
                methods={selectedNode.data.methods}
                onAttributes={(attributes) => updateSelected({ attributes })}
                onMethods={(methods) => updateSelected({ methods })}
              />
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
                onChange={(event) => editSelectedRelation({ label: event.target.value })}
              />
            </div>
            <div>
              <label htmlFor="edge-type">Type</label>
              <select
                id="edge-type"
                disabled={!editable}
                value={(selectedEdge.data?.relationType as UmlRelationType) ?? "association"}
                onChange={(event) =>
                  editSelectedRelation({ relationType: event.target.value as UmlRelationType })
                }
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
