"use client";

import { DocumentShell } from "@/components/document/document-shell";
import { PublicNoteMain } from "@/components/public-note/public-note-main";

interface Properties {
  id: string;
  title: string;
  markdown: string;
}

export function PublicNote(props: Properties) {
  const { id, title, markdown } = props;

  return (
    <DocumentShell documentType="note" email={null} workspaceId={null} workspaces={[]}>
      <PublicNoteMain id={id} markdown={markdown} title={title} />
    </DocumentShell>
  );
}
