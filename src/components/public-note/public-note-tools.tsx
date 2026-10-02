"use client";

import { NoteExport } from "@/components/note/note-export";
import { SaveState } from "@/components/document/save-state";

interface Properties {
  id: string;
  title: string;
  markdown: string;
}

export function PublicNoteTools(props: Properties) {
  const { id, title, markdown } = props;

  return (
    <div className="library-heading-actions topbar-tools">
      <NoteExport readMarkdown={() => markdown} title={title} />
      <SaveState canEdit={false} id={id} />
      <span className="badge">public</span>
    </div>
  );
}
