"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import {
  documentEditKey,
  documentSaveKey,
  documentSnapshotKey,
  documentVersionKey,
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

  function applyRemote(remote: DiagramContent, remoteVersion: number, title?: string) {
    const pendingBefore = new Set(dirty.pendingNodes);
    syncDirtyWithRemote(dirty, remote);
    applyRef.current(mergeRemoteDiagram(diagramRef.current(), remote, dirtyState(dirty)));
    appliedVersion.current = remoteVersion;
    if (title) {
      queryClient.setQueryData(documentSnapshotKey(id), { title, version: remoteVersion });
    }
    const promoted = [...dirty.pendingNodes].some((nodeId) => !pendingBefore.has(nodeId));
    if (promoted) schedule();
  }

  function finishSave(result: SavedDocument, patch: DiagramPatch) {
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
    void queryClient.invalidateQueries({ queryKey: documentVersionKey(id) });
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
      saveInFlight.current = true;
      save.mutate(
        { patch, version: appliedVersion.current },
        {
          onSuccess: (result) => finishSave(result, patch),
          onError: () => {
            queryClient.setQueryData(documentEditKey(id, "body"), "error");
          },
          onSettled: () => {
            saveInFlight.current = false;
          },
        },
      );
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
