"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { DocumentHeading } from "@/components/document/document-heading";
import { NoteTitle } from "@/components/document/note-title";
import {
  documentEditKey,
  documentSaveKey,
  documentVersionKey,
  DocumentSaveConflict,
  readOwnerDocument,
  saveOwnerDocument,
  type SavedDocument,
} from "@/components/document/document-client";
import { useDocumentVersion } from "@/components/document/use-document-version";
import { NoteShareMarkdown } from "@/components/note/note-share-markdown";
import { defaultTitle } from "@/lib/content";
import { remoteNoteMarkdown, remoteNoteTitle } from "@/lib/note-sync";

const NoteEditor = dynamic(() => import("@/components/note-editor").then((mod) => mod.NoteEditor), {
  ssr: false,
});

interface Properties {
  id: string;
  title: string;
  content: string;
  version: number;
  canEdit: boolean;
  crumb: ReactNode;
  sharing: boolean;
  tools: ReactNode;
  workspaceId: string | null;
}

function noteName(title: string) {
  return title === defaultTitle("note") ? "" : title;
}

export function NoteDocument(props: Properties) {
  const { id, title, content, version, canEdit, crumb, sharing, tools, workspaceId } = props;
  const queryClient = useQueryClient();
  const [name, setName] = useState(noteName(title));
  const [remote, setRemote] = useState({ markdown: content, version });
  const persistedTitle = useRef(title);
  const latest = useRef({ title, content });
  const dirty = useRef(false);
  const titleDirty = useRef(false);
  const saveInFlight = useRef(false);
  const appliedVersion = useRef(version);
  const conflictRetries = useRef(0);
  const saveGeneration = useRef(0);
  const timer = useRef<number | null>(null);
  const versionQuery = useDocumentVersion(id, canEdit);
  const save = useMutation({
    mutationKey: documentSaveKey(id),
    mutationFn: (body: { title?: string; content?: string; version: number }) =>
      saveOwnerDocument(id, body),
  });

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  function markSaved(result: SavedDocument, sent: { title?: string; content?: string }) {
    appliedVersion.current = result.version;
    if (sent.content !== undefined && latest.current.content === sent.content)
      dirty.current = false;
    if (sent.title !== undefined && latest.current.title === sent.title) {
      titleDirty.current = false;
      persistedTitle.current = sent.title;
    }
    if (result.title && !titleDirty.current) {
      persistedTitle.current = result.title;
      latest.current.title = result.title;
      setName(noteName(result.title));
    }
    queryClient.setQueryData(documentVersionKey(id), { version: result.version });
    if (dirty.current || titleDirty.current) {
      schedule();
      return;
    }
    queryClient.setQueryData(documentEditKey(id, "body"), "clean");
  }

  function publish(payload: { title?: string; content?: string; version: number }) {
    const sent = { title: payload.title, content: payload.content };
    const generation = ++saveGeneration.current;
    saveInFlight.current = true;
    save.mutate(payload, {
      onSuccess: (result) => {
        if (generation !== saveGeneration.current) return;
        conflictRetries.current = 0;
        markSaved(result, sent);
      },
      onError: (error) => {
        if (generation !== saveGeneration.current) return;
        if (retryConflict(error)) return;
        queryClient.setQueryData(documentEditKey(id, "body"), "error");
      },
      onSettled: () => {
        if (generation === saveGeneration.current) saveInFlight.current = false;
      },
    });
  }

  function retryConflict(error: unknown) {
    if (!(error instanceof DocumentSaveConflict) || conflictRetries.current >= 3) return false;
    if (typeof error.content !== "string") return false;
    conflictRetries.current += 1;
    appliedVersion.current = error.version;
    if (!dirty.current) {
      latest.current.content = error.content;
      setRemote({ markdown: error.content, version: error.version });
    }
    if (!titleDirty.current) {
      persistedTitle.current = error.title;
      latest.current.title = error.title;
      setName(noteName(error.title));
    }
    const payload: { title?: string; content?: string; version: number } = {
      version: error.version,
    };
    if (dirty.current) payload.content = latest.current.content;
    if (titleDirty.current) payload.title = latest.current.title;
    if (payload.content === undefined && payload.title === undefined) {
      queryClient.setQueryData(documentEditKey(id, "body"), "clean");
      return true;
    }
    publish(payload);
    return true;
  }

  function schedule(partial?: { title?: string; content?: string }) {
    if (partial?.content !== undefined) {
      latest.current.content = partial.content;
      dirty.current = true;
    }
    if (partial?.title !== undefined) {
      latest.current.title = partial.title;
      titleDirty.current = true;
    }
    if (!dirty.current && !titleDirty.current) {
      queryClient.setQueryData(documentEditKey(id, "body"), "clean");
      return;
    }
    queryClient.setQueryData(documentEditKey(id, "body"), "dirty");
    if (!canEdit) return;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      const payload: { title?: string; content?: string; version: number } = {
        version: appliedVersion.current,
      };
      if (dirty.current) payload.content = latest.current.content;
      if (titleDirty.current) payload.title = latest.current.title;
      conflictRetries.current = 0;
      publish(payload);
    }, 700);
  }

  function commitTitle(value: string) {
    setName(value);
    const trimmed = value.trim();
    if (!trimmed || trimmed === persistedTitle.current) {
      latest.current.title = persistedTitle.current;
      titleDirty.current = false;
      if (!dirty.current && timer.current) {
        window.clearTimeout(timer.current);
        timer.current = null;
        queryClient.setQueryData(documentEditKey(id, "body"), "clean");
      }
      return;
    }
    schedule({ title: trimmed });
  }

  function restoreTitle() {
    if (name.trim()) return;
    setName(noteName(persistedTitle.current));
  }

  useEffect(() => {
    const remoteVersion = versionQuery.data?.version;
    if (!canEdit || remoteVersion == null || remoteVersion <= appliedVersion.current) return;
    if (saveInFlight.current || save.isPending) return;
    let cancelled = false;
    void readOwnerDocument(id).then((document) => {
      if (cancelled || saveInFlight.current || typeof document.content !== "string") return;
      if (document.version <= appliedVersion.current) return;
      const next = remoteNoteMarkdown({
        dirty: dirty.current,
        saveInFlight: false,
        localMarkdown: latest.current.content,
        remoteMarkdown: document.content,
        remoteVersion: document.version,
        appliedVersion: appliedVersion.current,
      });
      const nextTitle = remoteNoteTitle({
        titleDirty: titleDirty.current,
        saveInFlight: false,
        localTitle: persistedTitle.current,
        remoteTitle: document.title,
        remoteVersion: document.version,
        appliedVersion: appliedVersion.current,
      });
      if (nextTitle !== persistedTitle.current) {
        persistedTitle.current = nextTitle;
        latest.current.title = nextTitle;
        setName(noteName(nextTitle));
      }
      if (!next.replace) return;
      latest.current.content = next.markdown;
      setRemote({ markdown: next.markdown, version: next.version });
      appliedVersion.current = next.version;
    });
    return () => {
      cancelled = true;
    };
  }, [canEdit, id, save.isPending, versionQuery.data]);

  return (
    <div className="document-note">
      <DocumentHeading
        crumb={crumb}
        title={
          <NoteTitle
            disabled={!canEdit}
            value={name}
            onBlur={restoreTitle}
            onChange={commitTitle}
          />
        }
        tools={tools}
      />
      {sharing ? (
        <NoteShareMarkdown
          readMarkdown={() => latest.current.content}
          title={name.trim() || title}
        />
      ) : null}
      <div className="note-sheet">
        <NoteEditor
          editable={canEdit}
          id={id}
          libraryShell
          markdown={remote.markdown}
          version={remote.version}
          workspaceId={workspaceId}
          onChange={(markdown) => schedule({ content: markdown })}
        />
      </div>
    </div>
  );
}
