"use client";

import { useEffect, useRef } from "react";
import { NotePageChoice } from "@/components/note/note-page-choice";
import type { NoteTitleRecord } from "@/lib/note-link";

interface Properties {
  notes: readonly NoteTitleRecord[];
  onChoose: (title: string) => void;
}

export function NotePagePickerList(props: Properties) {
  const { notes, onChoose } = props;
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    listRef.current?.querySelector("button")?.focus();
  }, []);

  return (
    <ul className="note-page-picker-list" ref={listRef}>
      {notes.map((note) => (
        <NotePageChoice key={note.id} onChoose={onChoose} title={note.title} />
      ))}
    </ul>
  );
}
