import type { LibraryFilter } from "@/components/library/board-document";
import { LibraryHeadingActions } from "@/components/library/library-heading-actions";
import { LibraryHeadingCopy } from "@/components/library/library-heading-copy";

interface Properties {
  filter: LibraryFilter;
  spaceName: string;
  workspaceId: string;
}

export function LibraryHeading(props: Properties) {
  const { filter, spaceName, workspaceId } = props;

  return (
    <div className="library-heading">
      <LibraryHeadingCopy filter={filter} spaceName={spaceName} />
      <LibraryHeadingActions workspaceId={workspaceId} />
    </div>
  );
}
