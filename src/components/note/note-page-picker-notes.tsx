"use client";

import { useQuery } from "@tanstack/react-query";
import { NotePagePickerList } from "@/components/note/note-page-picker-list";
import { useNoteWorkspace } from "@/components/note/note-workspace";
import { libraryItemsQueryOptions } from "@/lib/library-items";
import { notesForPageMenu } from "@/lib/note-page";
import { Alert } from "@/ui/Alert";
import { Status } from "@/ui/Status";

interface Properties {
  onChoose: (title: string) => void;
}

export function NotePagePickerNotes(props: Properties) {
  const { onChoose } = props;
  const workspaceId = useNoteWorkspace();
  const notes = useQuery(libraryItemsQueryOptions());

  if (notes.isPending) return <Status>Loading notes.</Status>;
  if (notes.isError) return <Alert>Could not load notes.</Alert>;

  const items = notesForPageMenu(notes.data, workspaceId);
  if (items.length === 0) return <Status>No notes in this workspace.</Status>;

  return <NotePagePickerList notes={items} onChoose={onChoose} />;
}
