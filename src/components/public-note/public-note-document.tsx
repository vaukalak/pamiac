"use client";

import { DocumentBreadcrumb } from "@/components/document/document-breadcrumb";
import { DocumentHeading } from "@/components/document/document-heading";
import { NoteTitle } from "@/components/document/note-title";
import { PublicNoteBody } from "@/components/public-note/public-note-body";
import { PublicNoteTools } from "@/components/public-note/public-note-tools";

interface Properties {
  id: string;
  title: string;
  markdown: string;
}

export function PublicNoteDocument(props: Properties) {
  const { id, title, markdown } = props;

  return (
    <div className="document-note">
      <DocumentHeading
        crumb={<DocumentBreadcrumb kind="note" spaceName={null} />}
        title={
          <NoteTitle disabled onBlur={() => undefined} onChange={() => undefined} value={title} />
        }
        tools={<PublicNoteTools id={id} markdown={markdown} title={title} />}
      />
      <PublicNoteBody markdown={markdown} />
    </div>
  );
}
