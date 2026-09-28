import type { LibraryFilter } from "@/components/library/board-document";

interface Properties {
  filter: LibraryFilter;
}

const COPY: Record<LibraryFilter, string> = {
  all: "Nothing here yet. Create a note or a class diagram, then share the direct link.",
  note: "No notes in this view.",
  diagram: "No diagrams in this view.",
};

export function LibraryEmpty(props: Properties) {
  const { filter } = props;

  return <div className="empty">{COPY[filter]}</div>;
}
