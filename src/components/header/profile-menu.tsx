"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ProfileMenuPanel } from "@/components/header/profile-menu-panel";

interface Properties {
  email: string;
}

export function ProfileMenu(props: Properties) {
  const { email } = props;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const letter = email.trim().charAt(0).toUpperCase() || "?";

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    }
    function onPointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <div className="profile" ref={rootRef}>
      <button
        aria-controls={menuId}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Account menu for ${email}`}
        className="profile-button"
        onClick={() => setOpen((value) => !value)}
        ref={buttonRef}
        type="button"
      >
        {letter}
      </button>
      {open ? <ProfileMenuPanel email={email} id={menuId} onClose={() => setOpen(false)} /> : null}
    </div>
  );
}
