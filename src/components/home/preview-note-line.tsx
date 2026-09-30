interface Properties {
  text: string;
}

export function PreviewNoteLine(props: Properties) {
  const { text } = props;

  return <p className="home-preview-check">{text}</p>;
}
