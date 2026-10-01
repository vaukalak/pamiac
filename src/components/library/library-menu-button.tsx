import type { RefObject } from "react";
import { LibraryMenuIcon } from "@/components/library/library-menu-icon";

interface Properties {
  buttonRef: RefObject<HTMLButtonElement | null>;
  controls: string;
  onToggle: () => void;
  open: boolean;
}

export function LibraryMenuButton(props: Properties) {
  const { buttonRef, controls, onToggle, open } = props;

  return (
    <button
      aria-controls={controls}
      aria-expanded={open}
      aria-haspopup="dialog"
      aria-label={open ? "Close menu" : "Open menu"}
      className="library-menu-button"
      onClick={onToggle}
      ref={buttonRef}
      type="button"
    >
      <LibraryMenuIcon />
    </button>
  );
}
