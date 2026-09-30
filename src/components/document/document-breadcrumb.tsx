interface Properties {
  kind: "note" | "diagram";
  spaceName: string | null;
}

export function DocumentBreadcrumb(props: Properties) {
  const { kind, spaceName } = props;
  const label = kind === "note" ? "Notes" : "Diagrams";
  const text = spaceName ? `${spaceName} / ${label}` : label;

  return <p className="library-crumb">{text}</p>;
}
