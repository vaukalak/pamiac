import { DocumentSketchNode } from "@/components/library/document-sketch-node";
import { readDiagram } from "@/lib/content";

interface Properties {
  content: string;
}

export function DocumentDiagramSketch(props: Properties) {
  const { content } = props;
  const diagram = readDiagram(content);
  if (diagram.nodes.length === 0) return <p>Empty diagram</p>;

  return (
    <div className="doc-sketch">
      {diagram.nodes.slice(0, 6).map((node) => (
        <DocumentSketchNode key={node.id} name={node.name} />
      ))}
    </div>
  );
}
