"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { documentPreview, type DocumentType } from "@/lib/content";

export type BoardDocument = {
  id: string;
  type: DocumentType;
  title: string;
  content: string;
  visibility: string;
  updatedAt: string;
};

export function DocumentBoard({ documents }: { documents: BoardDocument[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | DocumentType>("all");
  const [items, setItems] = useState(documents);
  const [dragging, setDragging] = useState<string | null>(null);
  const [creating, setCreating] = useState<DocumentType | null>(null);

  const visible = useMemo(
    () => items.filter((item) => filter === "all" || item.type === filter),
    [items, filter],
  );

  async function create(type: DocumentType) {
    setCreating(type);
    const response = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    setCreating(null);
    if (!response.ok) return;
    const body = (await response.json()) as { id: string };
    router.push(`/d/${body.id}`);
  }

  async function dropOn(targetId: string) {
    if (!dragging || dragging === targetId || filter !== "all") return;
    const next = [...items];
    const from = next.findIndex((item) => item.id === dragging);
    const to = next.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setItems(next);
    setDragging(null);
    await fetch("/api/documents", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: next.map((item) => item.id) }),
    });
  }

  return (
    <div>
      <div className="workspace-head">
        <div>
          <p className="eyebrow">Library</p>
          <h1>Notes and diagrams</h1>
        </div>
        <div className="row-actions">
          <button className="btn" disabled={creating !== null} onClick={() => create("note")} type="button">
            {creating === "note" ? "Creating…" : "New note"}
          </button>
          <button
            className="btn secondary"
            disabled={creating !== null}
            onClick={() => create("diagram")}
            type="button"
          >
            {creating === "diagram" ? "Creating…" : "New UML diagram"}
          </button>
        </div>
      </div>
      <div className="filters">
        {(
          [
            ["all", "All"],
            ["note", "Notes"],
            ["diagram", "Diagrams"],
          ] as const
        ).map(([value, label]) => (
          <a
            className={filter === value ? "active" : ""}
            href="#"
            key={value}
            onClick={(event) => {
              event.preventDefault();
              setFilter(value);
            }}
          >
            {label}
          </a>
        ))}
      </div>
      {visible.length === 0 ? (
        <div className="empty">
          Nothing here yet. Create a note or a class diagram, then share the direct link or hand an
          agent a token.
        </div>
      ) : (
        <div className="doc-grid">
          {visible.map((document) => (
            <Link
              className={`doc-card${dragging === document.id ? " dragging" : ""}`}
              draggable={filter === "all"}
              href={`/d/${document.id}`}
              key={document.id}
              onDragStart={() => setDragging(document.id)}
              onDragOver={(event) => {
                if (filter === "all") event.preventDefault();
              }}
              onDrop={(event) => {
                event.preventDefault();
                void dropOn(document.id);
              }}
            >
              <div className="meta">
                <span>{document.type === "note" ? "Note" : "UML"}</span>
                <span className="badge">{document.visibility}</span>
              </div>
              <h2>{document.title}</h2>
              <p>{documentPreview(document.type, document.content)}</p>
            </Link>
          ))}
        </div>
      )}
      {filter === "all" && items.length > 1 ? (
        <p className="hint">Drag cards to reorder the library.</p>
      ) : null}
    </div>
  );
}
