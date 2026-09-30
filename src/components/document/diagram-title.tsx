"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  documentEditKey,
  documentSaveKey,
  documentSnapshotKey,
  documentVersionKey,
  saveOwnerDocument,
  type DocumentSnapshot,
} from "@/components/document/document-client";
import { useDocumentVersion } from "@/components/document/use-document-version";

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
  const versionQuery = useDocumentVersion(id, canEdit);
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
      save.mutate(
        { title: sent, version: versionQuery.data?.version ?? appliedVersion.current },
        {
          onSuccess: (result) => {
            appliedVersion.current = result.version;
            if (nameRef.current.trim() !== sent) {
              schedule(nameRef.current);
              return;
            }
            dirty.current = false;
            persisted.current = result.title || sent;
            setName(persisted.current);
            queryClient.setQueryData(documentEditKey(id, "title"), "clean");
            void queryClient.invalidateQueries({ queryKey: documentVersionKey(id) });
          },
          onError: () => {
            queryClient.setQueryData(documentEditKey(id, "title"), "error");
          },
        },
      );
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
