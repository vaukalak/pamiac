"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  documentEditKey,
  documentSaveKey,
  documentSnapshotKey,
  documentVersionKey,
  DocumentSaveConflict,
  saveOwnerDocument,
  type DocumentSnapshot,
} from "@/components/document/document-client";

interface Properties {
  id: string;
  title: string;
  version: number;
  canEdit: boolean;
}

export function DiagramTitle(props: Properties) {
  const { id, title, version, canEdit } = props;
  const queryClient = useQueryClient();
  const [name, setName] = useState(title);
  const nameRef = useRef(title);
  const persisted = useRef(title);
  const dirty = useRef(false);
  const timer = useRef<number | null>(null);
  const appliedVersion = useRef(version);
  const conflictRetries = useRef(0);
  const saveGeneration = useRef(0);
  const snapshot = useQuery({
    queryKey: documentSnapshotKey(id),
    queryFn: async () => ({ title, version }) satisfies DocumentSnapshot,
    enabled: false,
    initialData: { title, version } satisfies DocumentSnapshot,
  });
  const save = useMutation({
    mutationKey: documentSaveKey(id),
    mutationFn: (body: { title: string; version: number }) => saveOwnerDocument(id, body),
  });

  nameRef.current = name;

  useEffect(() => {
    if (dirty.current || snapshot.data.title === persisted.current) return;
    persisted.current = snapshot.data.title;
    setName(snapshot.data.title);
  }, [snapshot.data]);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  function publish(sent: string) {
    const generation = ++saveGeneration.current;
    save.mutate(
      { title: sent, version: appliedVersion.current },
      {
        onSuccess: (result) => {
          if (generation !== saveGeneration.current) return;
          conflictRetries.current = 0;
          appliedVersion.current = result.version;
          queryClient.setQueryData(documentVersionKey(id), { version: result.version });
          if (nameRef.current.trim() !== sent) {
            schedule(nameRef.current);
            return;
          }
          dirty.current = false;
          persisted.current = result.title || sent;
          setName(persisted.current);
          queryClient.setQueryData(documentEditKey(id, "title"), "clean");
        },
        onError: (error) => {
          if (generation !== saveGeneration.current) return;
          if (retryConflict(error)) return;
          queryClient.setQueryData(documentEditKey(id, "title"), "error");
        },
      },
    );
  }

  function retryConflict(error: unknown) {
    if (!(error instanceof DocumentSaveConflict) || conflictRetries.current >= 3) return false;
    conflictRetries.current += 1;
    appliedVersion.current = error.version;
    const next = nameRef.current.trim();
    if (!next || next === persisted.current) {
      dirty.current = false;
      queryClient.setQueryData(documentEditKey(id, "title"), "clean");
      return true;
    }
    publish(next);
    return true;
  }

  function schedule(nextTitle: string) {
    setName(nextTitle);
    const trimmed = nextTitle.trim();
    if (!trimmed || trimmed === persisted.current) {
      dirty.current = false;
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = null;
      queryClient.setQueryData(documentEditKey(id, "title"), "clean");
      return;
    }
    dirty.current = true;
    queryClient.setQueryData(documentEditKey(id, "title"), "dirty");
    if (!canEdit) return;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      const sent = nameRef.current.trim();
      if (!sent || sent === persisted.current) {
        dirty.current = false;
        queryClient.setQueryData(documentEditKey(id, "title"), "clean");
        return;
      }
      conflictRetries.current = 0;
      publish(sent);
    }, 700);
  }

  return (
    <h1 className="document-title">
      <input
        aria-label="Title"
        className="title-input"
        disabled={!canEdit}
        value={name}
        onChange={(event) => schedule(event.target.value)}
      />
    </h1>
  );
}
