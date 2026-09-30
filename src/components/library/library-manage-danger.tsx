import { WorkspaceDelete } from "@/components/library/workspace-delete";
import { WorkspaceLeave } from "@/components/library/workspace-leave";

interface Properties {
  managing: boolean;
  workspaceId: string;
}

export function LibraryManageDanger(props: Properties) {
  const { managing, workspaceId } = props;

  return (
    <div className="library-manage-danger">
      <WorkspaceLeave key={workspaceId} workspaceId={workspaceId} />
      {managing ? <WorkspaceDelete key={workspaceId} workspaceId={workspaceId} /> : null}
    </div>
  );
}
