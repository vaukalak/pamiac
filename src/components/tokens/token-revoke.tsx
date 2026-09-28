"use client";

import { useState } from "react";

interface Properties {
  id: string;
  onRevoked: () => void;
}

export function TokenRevoke(props: Properties) {
  const { id, onRevoked } = props;
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function revoke() {
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/tokens?id=${id}`, { method: "DELETE" });
      if (!response.ok) {
        setError("Could not revoke this key");
        setPending(false);
        return;
      }
      onRevoked();
    } catch {
      setError("Could not revoke this key");
      setPending(false);
    }
  }

  return (
    <div className="token-revoke">
      <button
        className="btn danger small"
        disabled={pending}
        onClick={() => void revoke()}
        type="button"
      >
        {pending ? "Revoking…" : "Revoke"}
      </button>
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
