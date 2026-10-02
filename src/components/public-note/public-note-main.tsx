"use client";

import { PublicNoteDocument } from "@/components/public-note/public-note-document";
import { Page } from "@/ui/Page";

interface Properties {
  id: string;
  title: string;
  markdown: string;
}

export function PublicNoteMain(props: Properties) {
  const { id, title, markdown } = props;

  return (
    <Page className="library-main">
      <PublicNoteDocument id={id} markdown={markdown} title={title} />
    </Page>
  );
}
