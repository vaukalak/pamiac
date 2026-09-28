import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";

export function AppHeader({ email }: { email?: string | null }) {
  return (
    <header className="app-header">
      <Link className="brand" href={email ? "/workspace" : "/"}>
        <span className="brand-mark" aria-hidden="true" />
        Pamiac
      </Link>
      <nav className="nav-links">
        {email ? (
          <>
            <Link className="btn ghost" href="/workspace">
              Library
            </Link>
            <Link className="btn ghost" href="/workspace/tokens">
              Agent token
            </Link>
            <span className="hint">{email}</span>
            <SignOutButton />
          </>
        ) : (
          <Link className="btn" href="/login">
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}
