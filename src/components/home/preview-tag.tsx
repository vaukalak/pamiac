interface Properties {
  label: string;
}

export function PreviewTag(props: Properties) {
  const { label } = props;

  return <span className="home-preview-tag">{label}</span>;
}
