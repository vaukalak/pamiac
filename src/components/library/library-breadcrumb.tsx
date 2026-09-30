import type { LibraryFilter } from "@/components/library/board-document";

interface Properties {
  filter: LibraryFilter;
  spaceName: string;
}

const LABEL: Record<LibraryFilter, string> = {
  all: "Overview",
  note: "Notes",
  diagram: "Diagrams",
};

export function LibraryBreadcrumb(props: Properties) {
  const { filter, spaceName } = props;

  return (
    <p className="library-crumb">
      {spaceName} / {LABEL[filter]}
    </p>
  );
}
