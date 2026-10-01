import type {
  BoardChange,
  BoardDocument,
  LibraryFilter,
  LibraryView,
} from "@/components/library/board-document";
import { LibraryDocuments } from "@/components/library/library-documents";
import { LibraryMarkdownDrop } from "@/components/library/library-markdown-drop";
import { LibraryHeading } from "@/components/library/library-heading";
import { LibraryFilters } from "@/components/library/library-filters";
import { LibraryTools } from "@/components/library/library-tools";
import type { LibrarySearchValues } from "@/components/library/library-search";
import type { UseFormReturn } from "react-hook-form";

interface Properties {
  counts: Record<LibraryFilter, number>;
  dragging: string | null;
  filter: LibraryFilter;
  form: UseFormReturn<LibrarySearchValues>;
  libraryCount: number;
  onChange: (change: BoardChange) => void;
  onDragStart: (id: string) => void;
  onDrop: (id: string) => void;
  onFilter: (filter: LibraryFilter) => void;
  onView: (view: LibraryView) => void;
  reorder: boolean;
  spaceName: string;
  view: LibraryView;
  visible: BoardDocument[];
  workspaceId: string;
}

export function LibraryDashboard(props: Properties) {
  const {
    counts,
    dragging,
    filter,
    form,
    libraryCount,
    onChange,
    onDragStart,
    onDrop,
    onFilter,
    onView,
    reorder,
    spaceName,
    view,
    visible,
    workspaceId,
  } = props;

  return (
    <LibraryMarkdownDrop workspaceId={workspaceId}>
      <LibraryHeading filter={filter} spaceName={spaceName} workspaceId={workspaceId} />
      <LibraryFilters counts={counts} filter={filter} onChange={onFilter} />
      <LibraryTools form={form} onView={onView} view={view} />
      <LibraryDocuments
        dragging={dragging}
        filter={filter}
        layout={view}
        onChange={onChange}
        onDragStart={onDragStart}
        onDrop={onDrop}
        reorder={reorder}
        visible={visible}
      />
      {reorder && libraryCount > 1 ? (
        <p className="hint">Drag cards to reorder the library.</p>
      ) : null}
    </LibraryMarkdownDrop>
  );
}
