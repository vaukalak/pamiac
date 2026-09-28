"use client";

import { useState } from "react";

interface Properties {
  id: string;
  title: string;
  onCancel: () => void;
  onRenamed: (title: string) => void;
}

export function DocumentRename(props: Properties) {
  const { id, title, onCancel, onRenamed } = props;
  const [draft, setDraft] = useState(title);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const next = draft.trim();
    if (!next) {
      setError("Enter a title");
      return;
    }
    if (next.length > 160) {
      setError("Title is too long");
      return;
    }
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: next }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(body.error ?? "Could not rename this document");
        setPending(false);
        return;
      }
      onRenamed(next);
    } catch {
      setError("Could not rename this document");
      setPending(false);
    }
  }

  return (
    <form className="menu-form" onSubmit={(event) => void save(event)}>
      <label htmlFor={`rename-${id}`}>Title</label>
      <input
        id={`rename-${id}`}
        maxLength={160}
        onChange={(event) => setDraft(event.target.value)}
        value={draft}
      />
      <div className="row-actions">
        <button className="btn small" disabled={pending} type="submit">
          {pending ? "Saving…" : "Save"}
        </button>
        <button className="btn ghost small" onClick={onCancel} type="button">
          Cancel
        </button>
      </div>
      {error ? <p className="error">{error}</p> : null}
    </form>
  );
}
