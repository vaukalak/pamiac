"use client";

import { markdownFileName, noteExportMarkdown } from "@/lib/note-file";
import { Button } from "@/ui/Button";

interface Properties {
  readMarkdown: () => string;
  title: string;
}

export function NoteExport(props: Properties) {
  const { readMarkdown, title } = props;

  function download() {
    const markdown = noteExportMarkdown(readMarkdown());
    const file = new File([markdown], markdownFileName(title), { type: "text/markdown" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button className="secondary small" onClick={download} type="button">
      Export Markdown
    </Button>
  );
}
