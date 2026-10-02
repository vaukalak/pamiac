import { LibraryConnectLink } from "@/components/library/library-connect-link";
import { LibraryCreate } from "@/components/library/library-create";
import { LibraryCreateFolder } from "@/components/library/library-create-folder";

interface Properties {
  workspaceId: string;
}

export function LibraryHeadingActions(props: Properties) {
  const { workspaceId } = props;

  return (
    <div className="library-heading-actions">
      <LibraryCreate workspaceId={workspaceId} />
      <LibraryCreateFolder />
      <LibraryConnectLink className="btn secondary library-connect" />
    </div>
  );
}
