"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type DragEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { markdownDropChoice, markdownImportTitle, markdownTextError } from "@/lib/note-file";
import { libraryItemsQueryKey } from "@/lib/library-items";
import { Alert } from "@/ui/Alert";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  children: ReactNode;
  workspaceId: string;
}

async function readError(response: Response, fallback: string) {
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  return body?.error || fallback;
}

async function importMarkdown(workspaceId: string, file: File) {
  const text = await file.text();
  const invalid = markdownTextError(text);
  if (invalid) throw new Error(invalid);
  const created = await fetch("/api/documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "note",
      title: markdownImportTitle(file.name),
      workspaceId,
    }),
  }).catch(() => null);
  if (!created) throw new Error("Could not import that file.");
  const createdBody = (await created.json().catch(() => null)) as {
    id?: string;
    error?: string;
  } | null;
  if (!created.ok || !createdBody?.id) {
    throw new Error(createdBody?.error ?? "Could not import that file.");
  }
  const saved = await fetch(`/api/documents/${createdBody.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: text, version: 1 }),
  }).catch(() => null);
  if (!saved) {
    await fetch(`/api/documents/${createdBody.id}`, { method: "DELETE" }).catch(() => null);
    throw new Error("Could not import that file.");
  }
  if (!saved.ok) {
    const message = await readError(saved, "Could not import that file.");
    await fetch(`/api/documents/${createdBody.id}`, { method: "DELETE" }).catch(() => null);
    throw new Error(message);
  }
  return createdBody.id;
}

export function LibraryMarkdownDrop(props: Properties) {
  const { children, workspaceId } = props;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState("");
  const mutation = useMutation({
    mutationFn: (file: File) => importMarkdown(workspaceId, file),
    onSuccess: (id) => {
      setNotice("");
      void queryClient.invalidateQueries({ queryKey: libraryItemsQueryKey });
      router.push(`/d/${id}`);
    },
  });
  const message = mutation.error instanceof Error ? mutation.error.message : notice;

  function filesFrom(event: DragEvent<HTMLDivElement>) {
    return [...event.dataTransfer.files];
  }

  function onDragOver(event: DragEvent<HTMLDivElement>) {
    if (![...event.dataTransfer.types].includes("Files")) return;
    event.preventDefault();
    setDragging(true);
  }

  function onDragLeave(event: DragEvent<HTMLDivElement>) {
    if (event.currentTarget.contains(event.relatedTarget as Node)) return;
    setDragging(false);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    const files = filesFrom(event);
    if (files.length === 0) return;
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);
    const choice = markdownDropChoice(files);
    if (choice.status === "ignore") return;
    if (choice.status === "error") {
      mutation.reset();
      setNotice(choice.message);
      return;
    }
    const file = files[choice.index];
    if (!file) return;
    setNotice("");
    mutation.mutate(file);
  }

  const className = dragging ? "library-dashboard is-markdown-target" : "library-dashboard";

  return (
    <div className={className} onDragLeave={onDragLeave} onDragOver={onDragOver} onDrop={onDrop}>
      {children}
      {dragging ? <Paragraph>Drop the Markdown file to create a note.</Paragraph> : null}
      {message ? <Alert>{message}</Alert> : null}
    </div>
  );
}
