"use client";

import { DocumentShell } from "@/components/document/document-shell";
import { PublicNoteMain } from "@/components/public-note/public-note-main";
import { rewriteStoredR2Images } from "@/lib/stored-image-url";

interface Properties {
  id: string;
  title: string;
  markdown: string;
}

export function PublicNote(props: Properties) {
  const { id, title, markdown } = props;
  const readable = rewriteStoredR2Images(markdown);

  return (
    <DocumentShell documentType="note" email={null} workspaceId={null} workspaces={[]}>
      <PublicNoteMain id={id} markdown={readable} title={title} />
    </DocumentShell>
  );
}
