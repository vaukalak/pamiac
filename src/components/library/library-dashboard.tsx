import type {
  BoardChange,
  BoardDocument,
  LibraryFilter,
  LibraryView,
} from "@/components/library/board-document";
import { LibraryDocuments } from "@/components/library/library-documents";
import { LibraryTools } from "@/components/library/library-tools";

interface Properties {
  dragging: string | null;
  filter: LibraryFilter;
  libraryCount: number;
  onChange: (change: BoardChange) => void;
  onDragStart: (id: string) => void;
  onDrop: (id: string) => void;
  onFilter: (filter: LibraryFilter) => void;
  onView: (view: LibraryView) => void;
  reorder: boolean;
  view: LibraryView;
  visible: BoardDocument[];
  workspaceId: string;
}

export function LibraryDashboard(props: Properties) {
  const {
    dragging,
    filter,
    libraryCount,
    onChange,
    onDragStart,
    onDrop,
    onFilter,
    onView,
    reorder,
    view,
    visible,
    workspaceId,
  } = props;

  return (
    <div className="library-dashboard">
      <LibraryTools
        filter={filter}
        onFilter={onFilter}
        onView={onView}
        view={view}
        workspaceId={workspaceId}
      />
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
    </div>
  );
}
