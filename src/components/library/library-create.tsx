"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { DocumentType } from "@/lib/content";

interface Properties {
  workspaceId: string;
}

export function LibraryCreate(props: Properties) {
  const { workspaceId } = props;
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: async (type: DocumentType) => {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, workspaceId }),
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

  return (
    <div className="library-create">
      <details>
        <summary aria-label="New document" className="library-plus">
          <svg
            aria-hidden="true"
            fill="none"
            height="16"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.75"
            viewBox="0 0 16 16"
            width="16"
          >
            <path d="M8 3v10" />
            <path d="M3 8h10" />
          </svg>
        </summary>
        <div className="menu-panel">
          {message ? <p className="error">{message}</p> : null}
          <button
            className="menu-item"
            disabled={mutation.isPending}
            onClick={() => {
              mutation.mutate("note");
            }}
            type="button"
          >
            {creating === "note" ? "Creating…" : "New note"}
          </button>
          <button
            className="menu-item"
            disabled={mutation.isPending}
            onClick={() => {
              mutation.mutate("diagram");
            }}
            type="button"
          >
            {creating === "diagram" ? "Creating…" : "New UML diagram"}
          </button>
        </div>
      </details>
    </div>
  );
}
