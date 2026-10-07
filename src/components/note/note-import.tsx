"use client";

import { useQuery } from "@tanstack/react-query";
import { NoteImportButton } from "@/components/note/note-import-button";
import { NoteImportChoice } from "@/components/note/note-import-choice";
import { librarySpaces, PERSONAL_SPACE_ID } from "@/lib/library-spaces";
import { workspacesQueryOptions } from "@/lib/library-workspaces";
import { Alert } from "@/ui/Alert";
import { Button } from "@/ui/Button";

interface Properties {
  readMarkdown: () => string;
  title: string;
}

export function NoteImport(props: Properties) {
  const { readMarkdown, title } = props;
  const workspaces = useQuery(workspacesQueryOptions());

  if (workspaces.isPending) {
    return (
      <Button className="secondary small" disabled type="button">
        Import
      </Button>
    );
  }

  if (workspaces.isError) {
    const message =
      workspaces.error instanceof Error ? workspaces.error.message : "Could not load workspaces";
    return (
      <div className="share-markdown-import">
        <Alert>{message}</Alert>
      </div>
    );
  }

  const spaces = librarySpaces(workspaces.data);
  if (spaces.length > 1) {
    return <NoteImportChoice readMarkdown={readMarkdown} spaces={spaces} title={title} />;
  }

  return (
    <NoteImportButton
      readMarkdown={readMarkdown}
      title={title}
      workspaceId={spaces[0]?.id ?? PERSONAL_SPACE_ID}
    />
  );
}
