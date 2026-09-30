import { HOME_ICON_PATHS, type HomeIconName } from "@/components/home/home-icons";

export interface PreviewGraphNode {
  id: string;
  x: number;
  y: number;
  r: number;
  icon: HomeIconName;
  label: string;
}

interface Properties {
  node: PreviewGraphNode;
}

const ICON_SCALE = 0.8;
const ICON_HALF = 12 * ICON_SCALE;

export function PreviewNode(props: Properties) {
  const { node } = props;

  return (
    <g className="home-preview-node">
      <circle cx={node.x} cy={node.y} r={node.r} />
      <path
        d={HOME_ICON_PATHS[node.icon]}
        transform={`translate(${node.x - ICON_HALF} ${node.y - ICON_HALF}) scale(${ICON_SCALE})`}
        vectorEffect="non-scaling-stroke"
      />
      <text x={node.x} y={node.y + node.r + 16} textAnchor="middle">
        {node.label}
      </text>
    </g>
  );
}
