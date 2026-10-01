import type {
  BoardChange,
  BoardDocument,
  LibraryFilter,
  LibraryView,
} from "@/components/library/board-document";
import { LibraryDashboard } from "@/components/library/library-dashboard";
import type { LibrarySearchValues } from "@/components/library/library-search";
import { Page } from "@/ui/Page";
import type { UseFormReturn } from "react-hook-form";

interface Properties {
  className: string;
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

export function LibraryColumn(props: Properties) {
  const {
    className,
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
    <Page className={className}>
      <LibraryDashboard
        counts={counts}
        dragging={dragging}
        filter={filter}
        form={form}
        libraryCount={libraryCount}
        onChange={onChange}
        onDragStart={onDragStart}
        onDrop={onDrop}
        onFilter={onFilter}
        onView={onView}
        reorder={reorder}
        spaceName={spaceName}
        view={view}
        visible={visible}
        workspaceId={workspaceId}
      />
    </Page>
  );
}
