"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useNoteWorkspace } from "@/components/note/note-workspace";
import { libraryItemsQueryOptions } from "@/lib/library-items";
import { resolveNoteTitle } from "@/lib/note-link";

interface Properties {
  inlineContent: {
    props: {
      title: string;
    };
  };
}

export function NoteWikiLink(props: Properties) {
  const { inlineContent } = props;
  const title = inlineContent.props.title.trim();
  const workspaceId = useNoteWorkspace();
  const notes = useQuery(libraryItemsQueryOptions());
  const label = title ? `[[${title}]]` : "[[]]";

  if (!title || notes.isPending || notes.isError) {
    return <span className="note-wiki-unresolved">{label}</span>;
  }

  const id = resolveNoteTitle(title, notes.data, workspaceId);
  if (!id) return <span className="note-wiki-unresolved">{label}</span>;

  return (
    <Link className="note-wiki-link" href={`/d/${id}`}>
      {title}
    </Link>
  );
}
