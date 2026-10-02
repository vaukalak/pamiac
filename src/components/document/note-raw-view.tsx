interface Properties {
  markdown: string;
}

export function NoteRawView(props: Properties) {
  const { markdown } = props;

  return <pre className="note-raw">{markdown}</pre>;
}
