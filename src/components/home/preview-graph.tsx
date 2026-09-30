import { PreviewLink, type PreviewGraphLink } from "@/components/home/preview-link";
import { PreviewNode, type PreviewGraphNode } from "@/components/home/preview-node";

const CENTER = { x: 150, y: 148, r: 42 };

const LINKS: PreviewGraphLink[] = [
  {
    id: "notes",
    d: "M 58 80 V 112 L 96 150 H 108",
    dot: { x: 58, y: 112 },
    duration: 6,
    delay: -1,
  },
  {
    id: "diagrams",
    d: "M 236 80 V 112 L 198 150 H 192",
    dot: { x: 236, y: 112 },
    duration: 6,
    delay: -3.5,
  },
  { id: "agent", d: "M 150 214 V 190", dot: { x: 150, y: 202 }, duration: 4, delay: -2 },
];

const NODES: PreviewGraphNode[] = [
  { id: "notes", x: 58, y: 56, r: 24, icon: "notes", label: "Notes" },
  { id: "diagrams", x: 236, y: 56, r: 24, icon: "canvas", label: "Diagrams" },
  { id: "agent", x: 150, y: 236, r: 22, icon: "agent", label: "AI agent" },
];

export function PreviewGraph() {
  return (
    <svg className="home-preview-graph" viewBox="0 0 300 280" aria-hidden="true" focusable="false">
      {LINKS.map((link) => (
        <PreviewLink key={link.id} link={link} />
      ))}
      <circle className="home-preview-core" cx={CENTER.x} cy={CENTER.y} r={CENTER.r} />
      <text className="home-preview-core-label" x={CENTER.x} y={CENTER.y - 3} textAnchor="middle">
        Shared
      </text>
      <text className="home-preview-core-label" x={CENTER.x} y={CENTER.y + 12} textAnchor="middle">
        context
      </text>
      {NODES.map((node) => (
        <PreviewNode key={node.id} node={node} />
      ))}
    </svg>
  );
}
