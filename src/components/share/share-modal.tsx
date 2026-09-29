"use client";

import { useEffect, useRef, useState } from "react";
import { ShareActions } from "@/components/share/share-actions";
import { ShareLink } from "@/components/share/share-link";
import { ShareModeFields } from "@/components/share/share-mode-fields";
import { ShareModeList } from "@/components/share/share-mode-list";
import type { ShareResult } from "@/components/share/share-result";
import type { Visibility } from "@/lib/access";

interface Properties {
  emails: string[];
  hasPassword: boolean;
  id: string;
  visibility: Visibility;
  onClose: () => void;
  onSaved: (share: ShareResult) => void;
}

export function ShareModal(props: Properties) {
  const { emails, hasPassword, id, visibility, onClose, onSaved } = props;
  const [mode, setMode] = useState<Visibility>(visibility);
  const [emailText, setEmailText] = useState(emails.join("\n"));
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const node = dialogRef.current;
    if (!node) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    node.querySelector<HTMLElement>('input[type="radio"]:checked')?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !node) return;
      const focusable = [...node.querySelectorAll<HTMLElement>("button, input, textarea")].filter(
        (item) => !item.hasAttribute("disabled"),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, []);

  async function save() {
    setPending(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/documents/${id}/share`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visibility: mode,
          password: password || undefined,
          emails: emailText
            .split(/[\n,]/)
            .map((email) => email.trim())
            .filter(Boolean),
        }),
      });
      const body = (await response.json()) as Partial<ShareResult> & { error?: string };
      setPending(false);
      if (!response.ok || !body.visibility || !body.emails || body.hasPassword === undefined) {
        setError(body.error ?? "Could not update sharing");
        return;
      }
      setPassword("");
      setMessage("Sharing updated");
      onSaved({
        visibility: body.visibility,
        emails: body.emails,
        hasPassword: body.hasPassword,
      });
    } catch {
      setPending(false);
      setError("Could not update sharing");
    }
  }

  return (
    <div className="share-backdrop" onClick={onClose} role="presentation">
      <div
        aria-describedby="share-dialog-hint"
        aria-labelledby="share-dialog-title"
        aria-modal="true"
        className="share-dialog"
        onClick={(event) => event.stopPropagation()}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="share-dialog-head">
          <h2 id="share-dialog-title">Share</h2>
          <button className="btn ghost small" onClick={onClose} type="button">
            Close
          </button>
        </div>
        <p className="hint" id="share-dialog-hint">
          Anyone you share with opens this exact link. Only you can edit.
        </p>
        <ShareModeList mode={mode} onChange={setMode} />
        <ShareModeFields
          emailText={emailText}
          hasPassword={hasPassword}
          mode={mode}
          onEmailText={setEmailText}
          onPassword={setPassword}
          password={password}
        />
        <ShareLink id={id} key={mode} mode={mode} />
        <ShareActions
          error={error}
          message={message}
          onSave={() => void save()}
          pending={pending}
        />
      </div>
    </div>
  );
}
