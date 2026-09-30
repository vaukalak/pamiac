interface Properties {
  name: string;
}

export function DocumentSketchNode(props: Properties) {
  const { name } = props;

  return <span className="doc-sketch-node">{name}</span>;
}
