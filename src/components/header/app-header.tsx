"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppHeaderNav } from "@/components/header/app-header-nav";

interface Properties {
  email?: string | null;
}

export function AppHeader(props: Properties) {
  const { email } = props;
  const pathname = usePathname();
  const showSignIn = !email && pathname !== "/login";
  const showNav = Boolean(email) || showSignIn;

  return (
    <header className="app-header">
      <Link className="brand" href={email ? "/workspace" : "/"}>
        <span className="brand-mark" aria-hidden="true" />
        Pamiac
      </Link>
      {showNav ? <AppHeaderNav email={email} showSignIn={showSignIn} /> : null}
    </header>
  );
}
