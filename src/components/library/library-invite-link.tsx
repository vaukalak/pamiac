import { Button } from "@/ui/Button";

interface Properties {
  onInvite: () => void;
}

export function LibraryInviteLink(props: Properties) {
  const { onInvite } = props;

  return (
    <Button className="ghost library-rail-link" onClick={onInvite} type="button">
      Invite teammates
    </Button>
  );
}
