"use client";

import type { ReactNode, RefObject } from "react";
import type { UseFormReturn } from "react-hook-form";
import { ShareAccessForm } from "@/components/share/share-access-form";
import type { ShareDraft } from "@/components/share/share-draft";

interface Properties {
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

export function ShareDialogSurface(props: Properties) {
  const {
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
    <div
      aria-describedby="share-dialog-hint"
      aria-labelledby="share-dialog-title"
      aria-modal="true"
      className="share-dialog share-access-dialog"
      onClick={(event) => event.stopPropagation()}
      ref={dialogRef}
      role="dialog"
      tabIndex={-1}
    >
      <ShareAccessForm
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
      </ShareAccessForm>
    </div>
  );
}
