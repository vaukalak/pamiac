"use client";

import { useBlockNoteEditor } from "@blocknote/react";
import { useEffect, useRef } from "react";
import { NotePagePickerNotes } from "@/components/note/note-page-picker-notes";
import { noteSchema } from "@/components/note/note-schema";
import { insertNotePageLink } from "@/lib/note-page";
import { Button } from "@/ui/Button";
import { Paragraph } from "@/ui/Paragraph";
import { Section } from "@/ui/Section";

interface Properties {
  blockId: string;
  onClose: () => void;
}

export function NotePagePicker(props: Properties) {
  const { blockId, onClose } = props;
  const editor = useBlockNoteEditor<
    typeof noteSchema.blockSchema,
    typeof noteSchema.inlineContentSchema,
    typeof noteSchema.styleSchema
  >();
  const onCloseRef = useRef(onClose);
  const panelRef = useRef<HTMLDivElement>(null);
  onCloseRef.current = onClose;

  useEffect(() => {
    const node = panelRef.current;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const field = node?.querySelector<HTMLElement>("button");
    if (field) field.focus();
    else node?.focus();

    function onKey(event: KeyboardEvent) {
      if (!node) return;
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = [...node.querySelectorAll<HTMLElement>("button")].filter(
        (item) => !item.hasAttribute("disabled"),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, []);

  const choose = (title: string) => {
    insertNotePageLink(editor, blockId, title);
    onClose();
  };

  return (
    <div className="share-backdrop" onPointerDown={onClose} role="presentation">
      <div
        aria-labelledby="note-page-picker-title"
        aria-modal="true"
        className="share-dialog note-page-picker"
        onPointerDown={(event) => {
          event.stopPropagation();
        }}
        ref={panelRef}
        role="dialog"
        tabIndex={-1}
      >
        <Section>
          <h2 id="note-page-picker-title">Page</h2>
          <Paragraph>Choose a note.</Paragraph>
          <NotePagePickerNotes onChoose={choose} />
          <Button className="secondary" onClick={onClose}>
            Cancel
          </Button>
        </Section>
      </div>
    </div>
  );
}
