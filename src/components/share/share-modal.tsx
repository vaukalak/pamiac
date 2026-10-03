"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ShareActions } from "@/components/share/share-actions";
import { ShareLink } from "@/components/share/share-link";
import { ShareModeFields } from "@/components/share/share-mode-fields";
import { ShareModeList } from "@/components/share/share-mode-list";
import type { ShareResult } from "@/components/share/share-result";
import { ShareWorkspaceChoice } from "@/components/share/share-workspace-choice";
import type { Visibility } from "@/lib/access";
import { workspacesQueryOptions } from "@/lib/library-workspaces";
import { shareWorkspaceBody } from "@/lib/share-workspace";
import { Button } from "@/ui/Button";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  emails: string[];
  hasPassword: boolean;
  id: string;
  lockWorkspace?: boolean;
  markdownSlot?: boolean;
  visibility: Visibility;
  workspaceId: string | null;
  onClose: () => void;
  onSaved: (share: ShareResult) => void;
}

export function ShareModal(props: Properties) {
  const {
    emails,
    hasPassword,
    id,
    lockWorkspace = false,
    markdownSlot = false,
    visibility,
    workspaceId,
    onClose,
    onSaved,
  } = props;
  const [mode, setMode] = useState<Visibility>(visibility);
  const [emailText, setEmailText] = useState(emails.join("\n"));
  const [password, setPassword] = useState("");
  const [workspaceChoice, setWorkspaceChoice] = useState<string | null>(workspaceId);
  const spaces = useQuery({ ...workspacesQueryOptions(), enabled: !lockWorkspace });
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

  const saveShare = useMutation({
    mutationFn: async function save() {
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
          ...(lockWorkspace
            ? {}
            : shareWorkspaceBody(workspaceId, workspaceChoice, spaces.data ?? [])),
        }),
      }).catch(() => null);
      const body = (response ? await response.json().catch(() => null) : null) as
        (Partial<ShareResult> & { error?: string }) | null;
      if (
        !response ||
        !body ||
        !response.ok ||
        !body.visibility ||
        !body.emails ||
        body.hasPassword === undefined ||
        body.workspaceId === undefined
      ) {
        throw new Error(body?.error ?? "Could not update sharing");
      }
      return {
        visibility: body.visibility,
        emails: body.emails,
        hasPassword: body.hasPassword,
        workspaceId: body.workspaceId,
      };
    },
    onSuccess: (share) => {
      setPassword("");
      onSaved(share);
    },
  });

  return (
    <div className="share-backdrop" onClick={onClose} role="presentation">
      <div
        aria-describedby="share-dialog-hint"
        aria-labelledby="share-dialog-title"
        aria-modal="true"
        className={lockWorkspace ? "share-dialog workspace-add-dialog" : "share-dialog"}
        onClick={(event) => event.stopPropagation()}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="share-dialog-head">
          <h2 id="share-dialog-title">Share</h2>
          <Button className="ghost small" onClick={onClose} type="button">
            Close
          </Button>
        </div>
        <Paragraph className="hint" id="share-dialog-hint">
          Anyone you share with opens this exact link.
          <br />
          Only you can edit.
        </Paragraph>
        <ShareModeList mode={mode} onChange={setMode} />
        <ShareModeFields
          emailText={emailText}
          hasPassword={hasPassword}
          mode={mode}
          onEmailText={setEmailText}
          onPassword={setPassword}
          password={password}
        />
        {lockWorkspace ? null : (
          <ShareWorkspaceChoice onSelect={setWorkspaceChoice} selectedId={workspaceChoice} />
        )}
        <ShareLink id={id} key={mode} mode={mode} />
        {markdownSlot && !lockWorkspace ? <div id="note-share-markdown" /> : null}
        <ShareActions
          error={saveShare.error instanceof Error ? saveShare.error.message : ""}
          message={saveShare.isSuccess ? "Sharing updated" : ""}
          onSave={() => saveShare.mutate()}
          pending={saveShare.isPending}
          saveClassName={lockWorkspace ? "library-lime" : undefined}
        />
      </div>
    </div>
  );
}
