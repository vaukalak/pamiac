"use client";

import { useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useLibraryLocation } from "@/components/library/library-location";
import { LibraryPlusIcon } from "@/components/library/library-plus-icon";
import type { DocumentType } from "@/lib/content";
import { Button } from "@/ui/Button";

interface Properties {
  workspaceId: string;
}

export function LibraryCreate(props: Properties) {
  const { workspaceId } = props;
  const { folderId } = useLibraryLocation();
  const router = useRouter();
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const mutation = useMutation({
    mutationFn: async (type: DocumentType) => {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, workspaceId, folderId }),
      }).catch(() => null);
      if (!response) throw new Error("Could not create the document");
      const body = (await response.json().catch(() => null)) as {
        id?: string;
        error?: string;
      } | null;
      if (!response.ok || !body?.id) {
        throw new Error(body?.error ?? "Could not create the document");
      }
      return body.id;
    },
    onSuccess: (id) => {
      router.push(`/d/${id}`);
    },
  });
  const creating = mutation.isPending && mutation.variables ? mutation.variables : null;
  const message = mutation.error instanceof Error ? mutation.error.message : "";

  useEffect(() => {
    function onPointer(event: PointerEvent) {
      const details = detailsRef.current;
      if (!details?.open) return;
      if (details.contains(event.target as Node)) return;
      details.open = false;
    }

    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      const details = detailsRef.current;
      if (!details?.open) return;
      event.preventDefault();
      details.open = false;
      const summary = details.querySelector("summary");
      if (summary instanceof HTMLElement) summary.focus();
    }

    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="library-create">
      <details ref={detailsRef}>
        <summary aria-label="New document" className="library-plus">
          <LibraryPlusIcon />
          Create
        </summary>
        <div className="menu-panel">
          {message ? <p className="error">{message}</p> : null}
          <Button
            className="menu-item"
            disabled={mutation.isPending}
            onClick={() => {
              mutation.mutate("note");
            }}
            type="button"
          >
            {creating === "note" ? "Creating…" : "New note"}
          </Button>
          <Button
            className="menu-item"
            disabled={mutation.isPending}
            onClick={() => {
              mutation.mutate("diagram");
            }}
            type="button"
          >
            {creating === "diagram" ? "Creating…" : "New UML diagram"}
          </Button>
        </div>
      </details>
    </div>
  );
}
