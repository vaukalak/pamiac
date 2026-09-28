interface Properties {
  line: string;
}

export function CompartmentLine(props: Properties) {
  const { line } = props;

  return <li>{line}</li>;
}
