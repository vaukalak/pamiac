import Link from "next/link";
import { ProfileMenu } from "@/components/header/profile-menu";

interface Properties {
  email?: string | null;
  showSignIn: boolean;
}

export function AppHeaderNav(props: Properties) {
  const { email, showSignIn } = props;

  return (
    <nav className="nav-links">
      <Link className="btn ghost" href="/support">
        Support
      </Link>
      {email ? <ProfileMenu email={email} /> : null}
      {showSignIn ? (
        <Link className="btn" href="/login">
          Sign in
        </Link>
      ) : null}
    </nav>
  );
}
