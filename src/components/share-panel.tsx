"use client";

import { useState } from "react";
import type { Visibility } from "@/lib/access";

export function SharePanel({
  id,
  visibility,
  emails,
  hasPassword,
  onClose,
}: {
  id: string;
  visibility: Visibility;
  emails: string[];
  hasPassword: boolean;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<Visibility>(visibility);
  const [emailText, setEmailText] = useState(emails.join("\n"));
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const link = typeof window === "undefined" ? `/d/${id}` : `${window.location.origin}/d/${id}`;

  async function save() {
    setSaving(true);
    setError("");
    setMessage("");
    const response = await fetch(`/api/documents/${id}/share`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visibility: mode,
        password: password || undefined,
        emails: emailText.split(/[\n,]/).map((email) => email.trim()).filter(Boolean),
      }),
    });
    setSaving(false);
    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(body.error ?? "Could not update sharing");
      return;
    }
    setPassword("");
    setMessage("Sharing updated");
  }

  async function copy() {
    await navigator.clipboard.writeText(link);
    setMessage("Link copied");
  }

  return (
    <div className="share-backdrop" onClick={onClose} role="presentation">
      <aside className="share-panel" onClick={(event) => event.stopPropagation()} role="dialog" aria-label="Share">
        <div className="row-actions" style={{ justifyContent: "space-between" }}>
          <h2 style={{ margin: 0 }}>Share</h2>
          <button className="btn ghost" onClick={onClose} type="button">
            Close
          </button>
        </div>
        <p className="hint">Anyone you share with opens this exact link. Only you can edit.</p>
        <label className="choice">
          <input checked={mode === "private"} name="share" onChange={() => setMode("private")} type="radio" />
          <span>
            <strong>Private</strong>
            <span>Only you can open it.</span>
          </span>
        </label>
        <label className="choice">
          <input checked={mode === "emails"} name="share" onChange={() => setMode("emails")} type="radio" />
          <span>
            <strong>Specific emails</strong>
            <span>Invited people sign in with that email to view.</span>
          </span>
        </label>
        <label className="choice">
          <input checked={mode === "password"} name="share" onChange={() => setMode("password")} type="radio" />
          <span>
            <strong>Password</strong>
            <span>Anyone with the link and the password can view.</span>
          </span>
        </label>
        <label className="choice">
          <input checked={mode === "public"} name="share" onChange={() => setMode("public")} type="radio" />
          <span>
            <strong>Public</strong>
            <span>Anyone with the link can view.</span>
          </span>
        </label>
        {mode === "emails" ? (
          <div>
            <label htmlFor="share-emails">Emails</label>
            <textarea
              id="share-emails"
              value={emailText}
              onChange={(event) => setEmailText(event.target.value)}
              placeholder={"ada@example.com\ngrace@example.com"}
            />
          </div>
        ) : null}
        {mode === "password" ? (
          <div>
            <label htmlFor="share-password">{hasPassword ? "New password" : "Password"}</label>
            <input
              id="share-password"
              type="password"
              value={password}
              placeholder={hasPassword ? "Leave blank to keep the current password" : "At least 4 characters"}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
        ) : null}
        <div className="dev-link">{link}</div>
        <div className="row-actions" style={{ marginTop: 12 }}>
          <button className="btn" disabled={saving} onClick={() => void save()} type="button">
            {saving ? "Saving…" : "Save sharing"}
          </button>
          <button className="btn secondary" onClick={() => void copy()} type="button">
            Copy link
          </button>
        </div>
        {message ? <p className="hint">{message}</p> : null}
        {error ? <p className="error">{error}</p> : null}
      </aside>
    </div>
  );
}
