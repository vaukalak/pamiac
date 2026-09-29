"use client";

import type { LibraryFilter, LibraryView } from "@/components/library/board-document";
import { LibraryFilters } from "@/components/library/library-filters";
import { ViewToggle } from "@/components/library/view-toggle";

interface Properties {
  filter: LibraryFilter;
  onFilter: (filter: LibraryFilter) => void;
  onView: (view: LibraryView) => void;
  view: LibraryView;
}

export function LibraryTools(props: Properties) {
  const { filter, onFilter, onView, view } = props;

  return (
    <div className="library-tools">
      <LibraryFilters filter={filter} onChange={onFilter} />
      <ViewToggle onChange={onView} view={view} />
    </div>
  );
}
