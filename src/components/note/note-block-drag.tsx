"use client";

import { SideMenuExtension } from "@blocknote/core/extensions";
import { useBlockNoteEditor, useExtension } from "@blocknote/react";
import { useEffect, useSyncExternalStore } from "react";
import {
  blockIdFromTarget,
  blockIds,
  canDropBlock,
  dropPlacement,
  LONG_PRESS_MS,
  pointerMovedPastSlop,
} from "@/lib/note-block-drag";
import { hideSoftwareKeyboard } from "@/lib/note-menu-keyboard";
import {
  narrowNoteServerSnapshot,
  narrowNoteSnapshot,
  subscribeNarrowNote,
} from "@/lib/note-narrow";

interface Properties {
  editable: boolean;
}

export function NoteBlockDrag(props: Properties) {
  const { editable } = props;
  const editor = useBlockNoteEditor();
  const sideMenu = useExtension(SideMenuExtension);
  const narrow = useSyncExternalStore(
    subscribeNarrowNote,
    narrowNoteSnapshot,
    narrowNoteServerSnapshot,
  );

  useEffect(() => {
    if (!narrow || !editable) return;

    const root = editor.prosemirrorView.dom;
    let timer = 0;
    let startX = 0;
    let startY = 0;
    let pointerId = -1;
    let sourceId: string | null = null;
    let dragging = false;
    let suppressClick = false;
    let dataTransfer: DataTransfer | null = null;

    const clearMarker = () => {
      for (const node of root.querySelectorAll<HTMLElement>("[data-note-drop]")) {
        node.removeAttribute("data-note-drop");
      }
    };

    const markDrop = (x: number, y: number) => {
      clearMarker();
      const targetId = blockIdFromTarget(document.elementFromPoint(x, y));
      if (!targetId || !sourceId) return;
      const source = editor.getBlock(sourceId);
      if (!source || !canDropBlock(source, targetId)) return;
      const element = root.querySelector<HTMLElement>(`.bn-block[data-id="${targetId}"]`);
      if (!element) return;
      element.setAttribute("data-note-drop", dropPlacement(y, element.getBoundingClientRect()));
    };

    const moveBlock = (x: number, y: number) => {
      const targetId = blockIdFromTarget(document.elementFromPoint(x, y));
      const source = sourceId ? editor.getBlock(sourceId) : undefined;
      if (!source || !targetId) return;
      const element = root.querySelector<HTMLElement>(`.bn-block[data-id="${targetId}"]`);
      if (!element || !canDropBlock(source, targetId)) return;
      const placement = dropPlacement(y, element.getBoundingClientRect());
      const target = editor.getBlock(targetId);
      if (!target) return;
      editor.removeBlocks([source]);
      const refreshed = editor.getBlock(targetId);
      if (refreshed) editor.insertBlocks([source], refreshed, placement);
    };

    const finishDrag = (x: number, y: number) => {
      const before = blockIds(editor.document);
      if (editor.prosemirrorView.dragging !== null && dataTransfer) {
        const target = document.elementFromPoint(x, y) ?? root;
        target.dispatchEvent(
          new DragEvent("drop", {
            bubbles: true,
            cancelable: true,
            clientX: x,
            clientY: y,
            dataTransfer,
          }),
        );
        document.dispatchEvent(
          new DragEvent("dragend", {
            bubbles: true,
            cancelable: true,
            clientX: x,
            clientY: y,
            dataTransfer,
          }),
        );
      }
      if (blockIds(editor.document) === before) moveBlock(x, y);

      sideMenu.blockDragEnd();
      clearMarker();
      root.removeAttribute("inputmode");
      dataTransfer = null;
      dragging = false;
      sourceId = null;
      suppressClick = true;
    };

    const beginDrag = (x: number, y: number) => {
      if (!sourceId) return;
      const block = editor.getBlock(sourceId);
      if (!block) return;

      dragging = true;
      root.setAttribute("inputmode", "none");
      hideSoftwareKeyboard();

      try {
        if (typeof DataTransfer !== "undefined") {
          dataTransfer = new DataTransfer();
          sideMenu.blockDragStart({ dataTransfer, clientY: y }, block);
          document.dispatchEvent(
            new DragEvent("dragstart", {
              bubbles: true,
              cancelable: true,
              clientX: x,
              clientY: y,
              dataTransfer,
            }),
          );
        }
      } catch {
        dataTransfer = null;
      }

      markDrop(x, y);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const id = blockIdFromTarget(event.target);
      if (!id) return;
      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      sourceId = id;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => beginDrag(startX, startY), LONG_PRESS_MS);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      if (!dragging) {
        if (pointerMovedPastSlop(startX, startY, event.clientX, event.clientY)) {
          window.clearTimeout(timer);
          sourceId = null;
        }
        return;
      }

      event.preventDefault();
      if (dataTransfer && editor.prosemirrorView.dragging) {
        root.dispatchEvent(
          new DragEvent("dragover", {
            bubbles: true,
            cancelable: true,
            clientX: event.clientX,
            clientY: event.clientY,
            dataTransfer,
          }),
        );
      }
      markDrop(event.clientX, event.clientY);
    };

    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      window.clearTimeout(timer);
      if (dragging) {
        event.preventDefault();
        finishDrag(event.clientX, event.clientY);
      } else {
        sourceId = null;
      }
      pointerId = -1;
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (!dragging) return;
      event.preventDefault();
    };

    const onContextMenu = (event: Event) => {
      if (!dragging && sourceId === null) return;
      event.preventDefault();
    };

    const onClick = (event: MouseEvent) => {
      if (!suppressClick) return;
      suppressClick = false;
      event.preventDefault();
      event.stopPropagation();
    };

    root.addEventListener("pointerdown", onPointerDown);
    root.addEventListener("pointermove", onPointerMove);
    root.addEventListener("pointerup", onPointerUp);
    root.addEventListener("pointercancel", onPointerUp);
    root.addEventListener("touchend", onTouchEnd, { passive: false });
    root.addEventListener("contextmenu", onContextMenu);
    root.addEventListener("click", onClick, true);

    return () => {
      window.clearTimeout(timer);
      root.removeEventListener("pointerdown", onPointerDown);
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerup", onPointerUp);
      root.removeEventListener("pointercancel", onPointerUp);
      root.removeEventListener("touchend", onTouchEnd);
      root.removeEventListener("contextmenu", onContextMenu);
      root.removeEventListener("click", onClick, true);
      clearMarker();
      root.removeAttribute("inputmode");
    };
  }, [editable, editor, narrow, sideMenu]);

  return null;
}
