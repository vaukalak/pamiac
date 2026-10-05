"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ProfileTheme } from "@/components/header/profile-theme";
import { authClient } from "@/lib/auth-client";

interface Properties {
  email: string;
  id: string;
  onClose: () => void;
}

export function ProfileMenuPanel(props: Properties) {
  const { email, id, onClose } = props;
  const firstRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    firstRef.current?.focus();
  }, []);

  function logOut() {
    onClose();
    void authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.assign("/");
        },
      },
    });
  }

  return (
    <div className="profile-menu" id={id} role="menu">
      <p className="profile-email">{email}</p>
      <ProfileTheme />
      <Link className="menu-item" href="/profile" onClick={onClose} ref={firstRef} role="menuitem">
        Plan
      </Link>
      <Link className="menu-item" href="/workspace/tokens" onClick={onClose} role="menuitem">
        API keys
      </Link>
      <button className="menu-item" onClick={logOut} role="menuitem" type="button">
        Log out
      </button>
    </div>
  );
}
