"use client";

import { ProfileMenu } from "@/components/header/profile-menu";

interface Properties {
  email: string;
}

export function LibrarySidebarAccount(props: Properties) {
  const { email } = props;

  return (
    <div className="library-sidebar-account">
      <span className="library-sidebar-identity">{email}</span>
      <ProfileMenu email={email} />
    </div>
  );
}
