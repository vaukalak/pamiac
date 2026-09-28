"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { DocumentType } from "@/lib/content";

export function LibraryCreate() {
  const router = useRouter();
  const [creating, setCreating] = useState<DocumentType | null>(null);
  const [error, setError] = useState("");

  async function create(type: DocumentType) {
    setCreating(type);
    setError("");
    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const body = (await response.json()) as { id?: string; error?: string };
      if (!response.ok || !body.id) {
        setError(body.error ?? "Could not create the document");
        setCreating(null);
        return;
      }
      router.push(`/d/${body.id}`);
    } catch {
      setError("Could not create the document");
      setCreating(null);
    }
  }

  return (
    <div className="library-create">
      <div className="row-actions">
        <button
          className="btn"
          disabled={creating !== null}
          onClick={() => void create("note")}
          type="button"
        >
          {creating === "note" ? "Creating…" : "New note"}
        </button>
        <button
          className="btn secondary"
          disabled={creating !== null}
          onClick={() => void create("diagram")}
          type="button"
        >
          {creating === "diagram" ? "Creating…" : "New UML diagram"}
        </button>
      </div>
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
