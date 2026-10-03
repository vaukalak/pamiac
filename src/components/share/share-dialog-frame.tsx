"use client";

import type { ReactNode, RefObject } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { ShareDraft } from "@/components/share/share-draft";
import { ShareDialogSurface } from "@/components/share/share-dialog-surface";

interface Properties {
  backdropRef: RefObject<HTMLDivElement | null>;
  children: ReactNode;
  dialogRef: RefObject<HTMLDivElement | null>;
  error: string;
  form: UseFormReturn<ShareDraft>;
  hasPassword: boolean;
  id: string;
  message: string;
  pending: boolean;
  target: "document" | "folder";
  onClose: () => void;
  onSubmit: (values: ShareDraft) => void;
}

export function ShareDialogFrame(props: Properties) {
  const {
    backdropRef,
    children,
    dialogRef,
    error,
    form,
    hasPassword,
    id,
    message,
    pending,
    target,
    onClose,
    onSubmit,
  } = props;

  return (
    <div className="share-backdrop" onClick={onClose} ref={backdropRef} role="presentation">
      <ShareDialogSurface
        dialogRef={dialogRef}
        error={error}
        form={form}
        hasPassword={hasPassword}
        id={id}
        message={message}
        pending={pending}
        target={target}
        onClose={onClose}
        onSubmit={onSubmit}
      >
        {children}
      </ShareDialogSurface>
    </div>
  );
}
