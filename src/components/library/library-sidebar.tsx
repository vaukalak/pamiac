"use client";

import { useEffect, useId, useRef, useState } from "react";
import { LibraryMenuBackdrop } from "@/components/library/library-menu-backdrop";
import { LibraryMobileHeader } from "@/components/library/library-mobile-header";
import { LibrarySidebarPanel } from "@/components/library/library-sidebar-panel";
import type { LibraryFilter } from "@/components/library/board-document";
import type { NamedWorkspace } from "@/lib/library-spaces";

export type LibraryPage = "library" | "settings" | "members" | "document" | "connections";

interface Properties {
  email: string;
  filter: LibraryFilter;
  onFilter: (filter: LibraryFilter) => void;
  onSelect: (workspaceId: string) => void;
  page: LibraryPage;
  selectedId: string;
  workspaces: NamedWorkspace[];
}

const MOBILE_QUERY = "(max-width: 760px)";

function focusable(node: HTMLElement) {
  return [
    ...node.querySelectorAll<HTMLElement>(
      "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])",
    ),
  ];
}

export function LibrarySidebar(props: Properties) {
  const { email, filter, onFilter, onSelect, page, selectedId, workspaces } = props;
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const menuId = useId();
  const menuButton = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    const query = window.matchMedia(MOBILE_QUERY);

    function sync() {
      setMobile(query.matches);
      if (!query.matches) setOpen(false);
    }

    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!open || !mobile) return;
    const scrollY = window.scrollY;
    const { body, documentElement } = document;
    const previous = {
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyLeft: body.style.left,
      bodyRight: body.style.right,
      rootOverflow: documentElement.style.overflow,
    };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.overflow = "hidden";
    documentElement.style.overflow = "hidden";
    return () => {
      body.style.position = previous.bodyPosition;
      body.style.top = previous.bodyTop;
      body.style.left = previous.bodyLeft;
      body.style.right = previous.bodyRight;
      body.style.overflow = previous.bodyOverflow;
      documentElement.style.overflow = previous.rootOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [mobile, open]);

  useEffect(() => {
    const previous = wasOpen.current;
    wasOpen.current = open;
    if (!mobile) return;
    if (open) {
      panelRef.current?.focus();
      return;
    }
    if (!previous) return;
    const button = menuButton.current;
    window.requestAnimationFrame(() => {
      button?.focus();
    });
  }, [mobile, open]);

  useEffect(() => {
    if (!open || !mobile) return;

    function onKey(event: KeyboardEvent) {
      if (document.querySelector(".workspace-add-dialog")) return;
      const node = panelRef.current;
      if (!node) return;
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable(node);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobile, open]);

  function close() {
    setOpen(false);
  }

  function toggle() {
    setOpen((value) => !value);
  }

  function chooseFilter(next: LibraryFilter) {
    close();
    onFilter(next);
  }

  function chooseWorkspace(workspaceId: string) {
    close();
    onSelect(workspaceId);
  }

  return (
    <>
      <LibraryMobileHeader
        buttonRef={menuButton}
        controls={menuId}
        email={email}
        onToggle={toggle}
        open={open}
      />
      {open ? <LibraryMenuBackdrop onClose={close} /> : null}
      <LibrarySidebarPanel
        filter={filter}
        menuId={menuId}
        mobile={mobile}
        onClose={close}
        onFilter={chooseFilter}
        onSelect={chooseWorkspace}
        open={open}
        page={page}
        panelRef={panelRef}
        selectedId={selectedId}
        workspaces={workspaces}
      />
    </>
  );
}
