"use client";

import { SideMenuExtension } from "@blocknote/core/extensions";
import { useBlockNoteEditor, useExtension } from "@blocknote/react";
import { useSyncExternalStore } from "react";

const NARROW_QUERY = "(max-width: 760px)";
const MENU_SELECTOR = [
  ".bn-drag-handle-menu",
  ".note-turn-into-menu",
  ".bn-drag-handle-menu .bn-color-picker-dropdown",
].join(", ");

function subscribeToNarrow(onChange: () => void) {
  const query = window.matchMedia(NARROW_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function readNarrow() {
  return window.matchMedia(NARROW_QUERY).matches;
}

function narrowOnServer() {
  return false;
}

function subscribeToMenus(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.body, {
    attributeFilter: ["class"],
    attributes: true,
    childList: true,
    subtree: true,
  });
  return () => observer.disconnect();
}

function readMenus() {
  return document.querySelector(MENU_SELECTOR) !== null;
}

function menusOnServer() {
  return false;
}

export function NoteBlockMenuSheet() {
  const editor = useBlockNoteEditor();
  const sideMenu = useExtension(SideMenuExtension);
  const narrow = useSyncExternalStore(subscribeToNarrow, readNarrow, narrowOnServer);
  const open = useSyncExternalStore(subscribeToMenus, readMenus, menusOnServer);

  if (!open || !narrow) return null;

  return (
    <div
      aria-hidden="true"
      className="note-block-menu-backdrop"
      onPointerDown={(event) => {
        event.preventDefault();
        const menu = document.querySelector(".bn-drag-handle-menu");
        event.currentTarget.dispatchEvent(
          new MouseEvent("mousedown", { bubbles: true, cancelable: true }),
        );
        editor.focus();
        window.setTimeout(() => {
          if (menu && !menu.isConnected) sideMenu.unfreezeMenu();
        }, 320);
      }}
    />
  );
}
