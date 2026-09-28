"use client";

import { useState } from "react";

interface Properties {
  id: string;
  onCancel: () => void;
  onDeleted: () => void;
}

export function DocumentDelete(props: Properties) {
  const { id, onCancel, onDeleted } = props;
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function remove() {
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(body.error ?? "Could not delete this document");
        setPending(false);
        return;
      }
      onDeleted();
    } catch {
      setError("Could not delete this document");
      setPending(false);
    }
  }

  return (
    <div className="menu-confirm">
      <p>Delete this document?</p>
      <div className="row-actions">
        <button
          className="btn danger small"
          disabled={pending}
          onClick={() => void remove()}
          type="button"
        >
          {pending ? "Deleting…" : "Delete"}
        </button>
        <button className="btn ghost small" disabled={pending} onClick={onCancel} type="button">
          Cancel
        </button>
      </div>
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
