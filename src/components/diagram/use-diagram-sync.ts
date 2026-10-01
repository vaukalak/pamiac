"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import {
  documentEditKey,
  documentSaveKey,
  documentSnapshotKey,
  documentVersionKey,
  DocumentSaveConflict,
  readOwnerDocument,
  saveOwnerDocument,
  type SavedDocument,
} from "@/components/document/document-client";
import { useDocumentVersion } from "@/components/document/use-document-version";
import type { DiagramContent } from "@/lib/diagram";
import {
  acknowledgePatch,
  buildDiagramPatch,
  isDiagramDirty,
  syncDirtyWithRemote,
  dirtyState,
  type DiagramDirty,
} from "@/lib/diagram-dirty";
import { mergeRemoteDiagram } from "@/lib/diagram-merge";
import type { DiagramPatch } from "@/lib/diagram-patch";

interface Input {
  id: string;
  version: number;
  editable: boolean;
  hold: boolean;
  dirty: DiagramDirty;
  diagram: () => DiagramContent;
  apply: (diagram: DiagramContent) => void;
}

export function useDiagramSync(input: Input) {
  const { id, version, editable, hold, dirty } = input;
  const diagramRef = useRef(input.diagram);
  const applyRef = useRef(input.apply);
  const holdRef = useRef(hold);
  const saveInFlight = useRef(false);
  const appliedVersion = useRef(version);
  const conflictRetries = useRef(0);
  const saveGeneration = useRef(0);
  const timer = useRef<number | null>(null);
  const queryClient = useQueryClient();
  const versionQuery = useDocumentVersion(id, editable);
  const save = useMutation({
    mutationKey: documentSaveKey(id),
    mutationFn: (body: { patch: DiagramPatch; version: number }) => saveOwnerDocument(id, body),
  });

  diagramRef.current = input.diagram;
  applyRef.current = input.apply;
  holdRef.current = hold;

  function adoptRemote(remote: DiagramContent, remoteVersion: number, title?: string) {
    const pendingBefore = new Set(dirty.pendingNodes);
    syncDirtyWithRemote(dirty, remote);
    applyRef.current(mergeRemoteDiagram(diagramRef.current(), remote, dirtyState(dirty)));
    appliedVersion.current = remoteVersion;
    if (title) {
      queryClient.setQueryData(documentSnapshotKey(id), { title, version: remoteVersion });
    }
    return [...dirty.pendingNodes].some((nodeId) => !pendingBefore.has(nodeId));
  }

  function applyRemote(remote: DiagramContent, remoteVersion: number, title?: string) {
    if (adoptRemote(remote, remoteVersion, title)) schedule();
  }

  function finishSave(result: SavedDocument, patch: DiagramPatch) {
    queryClient.setQueryData(documentVersionKey(id), { version: result.version });
    if (typeof result.content === "string") return;
    const current = diagramRef.current();
    acknowledgePatch(dirty, patch, current);
    applyRemote(result.content, result.version, result.title);
    if (isDiagramDirty(dirty)) {
      queryClient.setQueryData(documentEditKey(id, "body"), "dirty");
      schedule();
      return;
    }
    queryClient.setQueryData(documentEditKey(id, "body"), "clean");
  }

  function publish(patch: DiagramPatch) {
    const generation = ++saveGeneration.current;
    saveInFlight.current = true;
    save.mutate(
      { patch, version: appliedVersion.current },
      {
        onSuccess: (result) => {
          if (generation !== saveGeneration.current) return;
          conflictRetries.current = 0;
          finishSave(result, patch);
        },
        onError: (error) => {
          if (generation !== saveGeneration.current) return;
          if (retryConflict(error)) return;
          queryClient.setQueryData(documentEditKey(id, "body"), "error");
        },
        onSettled: () => {
          if (generation === saveGeneration.current) saveInFlight.current = false;
        },
      },
    );
  }

  function retryConflict(error: unknown) {
    if (!(error instanceof DocumentSaveConflict) || conflictRetries.current >= 3) return false;
    if (typeof error.content === "string") return false;
    conflictRetries.current += 1;
    adoptRemote(error.content, error.version, error.title);
    if (!isDiagramDirty(dirty)) {
      queryClient.setQueryData(documentEditKey(id, "body"), "clean");
      return true;
    }
    publish(buildDiagramPatch(diagramRef.current(), dirty));
    return true;
  }

  function schedule() {
    if (!editable) return;
    queryClient.setQueryData(documentEditKey(id, "body"), "dirty");
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      if (!isDiagramDirty(dirty)) {
        queryClient.setQueryData(documentEditKey(id, "body"), "clean");
        return;
      }
      const patch = buildDiagramPatch(diagramRef.current(), dirty);
      conflictRetries.current = 0;
      publish(patch);
    }, 700);
  }

  useEffect(() => {
    const remoteVersion = versionQuery.data?.version;
    if (!editable || remoteVersion == null) return;
    if (hold || saveInFlight.current || save.isPending) return;
    if (remoteVersion <= appliedVersion.current) return;
    let cancelled = false;
    void readOwnerDocument(id).then((document) => {
      if (cancelled || holdRef.current || saveInFlight.current) return;
      if (typeof document.content === "string") return;
      if (document.version <= appliedVersion.current) return;
      applyRemote(document.content, document.version, document.title);
    });
    return () => {
      cancelled = true;
    };
  }, [editable, hold, id, save.isPending, versionQuery.data]);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  return { schedule };
}
