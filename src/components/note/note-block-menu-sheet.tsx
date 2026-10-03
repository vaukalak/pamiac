"use client";

import { SideMenuExtension } from "@blocknote/core/extensions";
import { useBlockNoteEditor, useExtension } from "@blocknote/react";
import { useEffect, useSyncExternalStore } from "react";
import { cancelResumeEditing } from "@/lib/note-menu-keyboard";

const NARROW_QUERY = "(max-width: 760px)";
const MENU_SELECTOR = [
  ".bn-drag-handle-menu",
  ".note-turn-into-menu",
  ".bn-color-picker-dropdown",
  ".bn-select",
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

  useEffect(() => {
    const html = document.documentElement;
    const write = () => {
      const menu = document.querySelector<HTMLElement>(".bn-drag-handle-menu");
      if (!menu) {
        html.style.removeProperty("--note-menu-line");
        return;
      }
      html.style.setProperty("--note-menu-line", `${menu.offsetHeight}px`);
    };
    write();
    const observer = new ResizeObserver(write);
    const watch = () => {
      write();
      const menu = document.querySelector(".bn-drag-handle-menu");
      if (menu) observer.observe(menu);
    };
    watch();
    const mutation = new MutationObserver(watch);
    mutation.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      mutation.disconnect();
      html.style.removeProperty("--note-menu-line");
    };
  }, []);

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
        cancelResumeEditing();
        editor.blur();
        window.setTimeout(() => {
          if (menu && !menu.isConnected) sideMenu.unfreezeMenu();
        }, 320);
      }}
    />
  );
}
