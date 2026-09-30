import Link from "next/link";
import { LibraryConnectLink } from "@/components/library/library-connect-link";
import { LibraryInviteLink } from "@/components/library/library-invite-link";

interface Properties {
  managing: boolean;
  onManage: () => void;
}

export function LibraryRailLinks(props: Properties) {
  const { managing, onManage } = props;

  return (
    <div className="library-rail-links">
      <LibraryConnectLink />
      {managing ? <LibraryInviteLink onInvite={onManage} /> : null}
      <Link className="library-rail-link" href="/support">
        Support
      </Link>
    </div>
  );
}
