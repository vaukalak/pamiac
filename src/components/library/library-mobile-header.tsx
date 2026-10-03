"use client";

import { useEffect, type RefObject } from "react";
import { ProfileMenu } from "@/components/header/profile-menu";
import { LibraryBrand } from "@/components/library/library-brand";
import { LibraryMenuButton } from "@/components/library/library-menu-button";
import { bindVisualViewportOffset } from "@/lib/visual-viewport-offset";

interface Properties {
  buttonRef: RefObject<HTMLButtonElement | null>;
  controls: string;
  email: string;
  onToggle: () => void;
  open: boolean;
}

export function LibraryMobileHeader(props: Properties) {
  const { buttonRef, controls, email, onToggle, open } = props;

  useEffect(() => bindVisualViewportOffset(document.documentElement, window), []);

  return (
    <header className="library-mobile-header">
      <LibraryMenuButton
        buttonRef={buttonRef}
        controls={controls}
        onToggle={onToggle}
        open={open}
      />
      <LibraryBrand />
      <ProfileMenu email={email} />
    </header>
  );
}
