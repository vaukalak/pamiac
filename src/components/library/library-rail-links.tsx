import Link from "next/link";
import { LibraryConnectLink } from "@/components/library/library-connect-link";

export function LibraryRailLinks() {
  return (
    <div className="library-rail-links">
      <LibraryConnectLink />
      <Link className="library-rail-link" href="/support">
        Support
      </Link>
    </div>
  );
}
