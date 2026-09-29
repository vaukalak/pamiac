import Link from "next/link";
import { ProfileMenu } from "@/components/header/profile-menu";

interface Properties {
  email?: string | null;
}

export function AppHeader(props: Properties) {
  const { email } = props;

  return (
    <header className="app-header">
      <Link className="brand" href={email ? "/workspace" : "/"}>
        <span className="brand-mark" aria-hidden="true" />
        Pamiac
      </Link>
      <nav className="nav-links">
        {email ? (
          <ProfileMenu email={email} />
        ) : (
          <Link className="btn" href="/login">
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}
