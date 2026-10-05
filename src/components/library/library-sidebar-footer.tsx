import Link from "next/link";
import { LibrarySidebarAccount } from "@/components/library/library-sidebar-account";

interface Properties {
  email: string;
}

export function LibrarySidebarFooter(props: Properties) {
  const { email } = props;

  return (
    <footer className="library-sidebar-footer">
      <Link className="library-nav-item" href="/support">
        Support
      </Link>
      <LibrarySidebarAccount email={email} />
    </footer>
  );
}
