import { Button } from "@/ui/Button";

interface Properties {
  onClose: () => void;
}

export function WorkspaceInviteHeading(props: Properties) {
  const { onClose } = props;

  return (
    <div className="share-dialog-head">
      <h2 id="workspace-invite-title">Workspace invitation</h2>
      <Button className="ghost" onClick={onClose} type="button">
        Close
      </Button>
    </div>
  );
}
