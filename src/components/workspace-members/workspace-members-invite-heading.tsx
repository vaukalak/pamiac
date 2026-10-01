import { Button } from "@/ui/Button";

interface Properties {
  onClose: () => void;
}

export function WorkspaceMembersInviteHeading(props: Properties) {
  const { onClose } = props;

  return (
    <div className="share-dialog-head">
      <h2 id="workspace-member-invite-title">Invite member</h2>
      <Button className="ghost small" onClick={onClose} type="button">
        Cancel
      </Button>
    </div>
  );
}
