"use client";

import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { ShareDialogFrame } from "@/components/share/share-dialog-frame";
import { shareDraftError, shareEmailList, type ShareDraft } from "@/components/share/share-draft";
import type { ShareResult } from "@/components/share/share-result";
import type { Visibility } from "@/lib/access";

interface Properties {
  emails: string[];
  hasPassword: boolean;
  id: string;
  lockWorkspace?: boolean;
  markdownSlot?: boolean;
  target?: "document" | "folder";
  visibility: Visibility;
  workspaceId: string | null;
  onClose: () => void;
  onSaved: (share: ShareResult) => void;
}

function holdOutside(backdrop: HTMLElement) {
  const restored: HTMLElement[] = [];
  let current: HTMLElement | null = backdrop;
  while (current) {
    const parent: HTMLElement | null = current.parentElement;
    if (!parent) break;
    for (const child of parent.children) {
      if (child !== current && child instanceof HTMLElement && !child.inert) {
        child.inert = true;
        restored.push(child);
      }
    }
    if (parent === document.body) break;
    current = parent;
  }
  return function release() {
    for (const element of restored) element.inert = false;
  };
}

export function ShareModal(props: Properties) {
  const {
    emails,
    hasPassword,
    id,
    lockWorkspace = false,
    markdownSlot = false,
    target = "document",
    visibility,
    workspaceId,
    onClose,
    onSaved,
  } = props;
  const form = useForm<ShareDraft>({
    defaultValues: {
      emails: emails.join("\n"),
      password: "",
      visibility,
    },
  });
  const dialogRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const chosen = form.watch("visibility");

  useEffect(() => {
    form.clearErrors();
  }, [chosen, form]);

  useEffect(() => {
    const node = dialogRef.current;
    const backdrop = backdropRef.current;
    if (!node || !backdrop) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    node.querySelector<HTMLElement>('input[type="radio"]:checked')?.focus();
    const release = holdOutside(backdrop);

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !node) return;
      const focusable = [
        ...node.querySelectorAll<HTMLElement>("button, input, textarea, select, a[href]"),
      ].filter((item) => !item.hasAttribute("disabled"));
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
      release();
      previous?.focus();
    };
  }, []);

  const saveShare = useMutation({
    mutationFn: async function save(values: ShareDraft) {
      const folderTarget = target === "folder";
      const response = await fetch(
        folderTarget ? `/api/folders/${id}/share` : `/api/documents/${id}/share`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            emails: shareEmailList(values.emails),
            password:
              values.visibility === "password" && values.password ? values.password : undefined,
            visibility: values.visibility,
          }),
        },
      ).catch(() => null);
      const body = (response ? await response.json().catch(() => null) : null) as
        (Partial<ShareResult> & { error?: string }) | null;
      if (
        !response ||
        !body ||
        !response.ok ||
        !body.visibility ||
        !body.emails ||
        body.hasPassword === undefined ||
        (!folderTarget && body.workspaceId === undefined)
      ) {
        throw new Error(body?.error ?? "Could not update sharing");
      }
      return {
        emails: body.emails,
        hasPassword: body.hasPassword,
        visibility: body.visibility,
        workspaceId: folderTarget ? workspaceId : (body.workspaceId ?? null),
      };
    },
    onSuccess: (share) => {
      form.setValue("password", "");
      onSaved(share);
    },
  });

  function submit(values: ShareDraft) {
    if (saveShare.isPending) return;
    const draftError = shareDraftError(values, hasPassword);
    if (draftError) {
      form.setError(draftError.field, { message: draftError.message });
      return;
    }
    saveShare.mutate(values);
  }

  const error = saveShare.error instanceof Error ? saveShare.error.message : "";

  return (
    <ShareDialogFrame
      backdropRef={backdropRef}
      dialogRef={dialogRef}
      error={error}
      form={form}
      hasPassword={hasPassword}
      id={id}
      message={saveShare.isSuccess ? "Sharing updated" : ""}
      pending={saveShare.isPending}
      target={target}
      onClose={onClose}
      onSubmit={submit}
    >
      {markdownSlot && !lockWorkspace ? <div id="note-share-markdown" /> : null}
    </ShareDialogFrame>
  );
}
