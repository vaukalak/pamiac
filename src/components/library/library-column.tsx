import type {
  BoardChange,
  BoardDocument,
  LibraryFilter,
  LibraryView,
} from "@/components/library/board-document";
import { LibraryDashboard } from "@/components/library/library-dashboard";
import { LibraryManage } from "@/components/library/library-manage";
import type { LibrarySearchValues } from "@/components/library/library-search";
import { LibrarySwitcher, type LibraryPanel } from "@/components/library/library-switcher";
import { PERSONAL_SPACE_ID } from "@/lib/library-spaces";
import { Page } from "@/ui/Page";
import type { UseFormReturn } from "react-hook-form";

interface Properties {
  className: string;
  counts: Record<LibraryFilter, number>;
  dragging: string | null;
  filter: LibraryFilter;
  form: UseFormReturn<LibrarySearchValues>;
  libraryCount: number;
  managing: boolean;
  onChange: (change: BoardChange) => void;
  onDragStart: (id: string) => void;
  onDrop: (id: string) => void;
  onFilter: (filter: LibraryFilter) => void;
  onView: (view: LibraryView) => void;
  panel: LibraryPanel;
  reorder: boolean;
  setPanel: (panel: LibraryPanel) => void;
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
    managing,
    onChange,
    onDragStart,
    onDrop,
    onFilter,
    onView,
    panel,
    reorder,
    setPanel,
    spaceName,
    view,
    visible,
    workspaceId,
  } = props;

  return (
    <Page className={className}>
      {workspaceId === PERSONAL_SPACE_ID ? null : (
        <LibrarySwitcher mode={panel} onMode={setPanel} />
      )}
      {workspaceId !== PERSONAL_SPACE_ID && panel === "manage" ? (
        <LibraryManage managing={managing} workspaceId={workspaceId} />
      ) : (
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
      )}
    </Page>
  );
}
