"use client";

import { copyToClipboard } from "@/lib/block-link";
import { noteExportMarkdown } from "@/lib/note-file";
import { Button } from "@/ui/Button";

interface Properties {
  readMarkdown: () => string;
}

export function NoteCopyMarkdown(props: Properties) {
  const { readMarkdown } = props;

  function copy() {
    const markdown = noteExportMarkdown(readMarkdown());
    void copyToClipboard((value) => navigator.clipboard.writeText(value), markdown);
  }

  return (
    <Button className="secondary small" onClick={copy} type="button">
      Copy Markdown
    </Button>
  );
}
