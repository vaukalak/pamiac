import { WorkspaceDelete } from "@/components/library/workspace-delete";
import { WorkspaceLeave } from "@/components/library/workspace-leave";
import { WorkspaceMemberAdd } from "@/components/library/workspace-member-add";
import { PERSONAL_SPACE_ID } from "@/lib/library-spaces";

interface Properties {
  managing: boolean;
  workspaceId: string;
}

export function LibraryManage(props: Properties) {
  const { managing, workspaceId } = props;

  return (
    <div className="library-manage">
      {workspaceId === PERSONAL_SPACE_ID ? (
        <p className="hint">Personal space has no shared members.</p>
      ) : null}
      {managing ? <WorkspaceMemberAdd key={workspaceId} workspaceId={workspaceId} /> : null}
      <WorkspaceLeave key={workspaceId} workspaceId={workspaceId} />
      {managing ? <WorkspaceDelete key={workspaceId} workspaceId={workspaceId} /> : null}
    </div>
  );
}
