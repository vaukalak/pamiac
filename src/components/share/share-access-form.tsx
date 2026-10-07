"use client";

import type { ReactNode } from "react";
import type { UseFormReturn } from "react-hook-form";
import { ShareAccessBody } from "@/components/share/share-access-body";
import type { ShareDraft } from "@/components/share/share-draft";
import { Form } from "@/ui/Form";

interface Properties {
  children: ReactNode;
  error: string;
  form: UseFormReturn<ShareDraft>;
  hasPassword: boolean;
  id: string;
  message: string;
  pending: boolean;
  target: "document" | "folder";
  workspaceId: string | null;
  onClose: () => void;
  onSubmit: (values: ShareDraft) => void;
}

export function ShareAccessForm(props: Properties) {
  const {
    children,
    error,
    form,
    hasPassword,
    id,
    message,
    pending,
    target,
    workspaceId,
    onClose,
    onSubmit,
  } = props;

  return (
    <Form.Context className="share-access-form" form={form} onSubmit={onSubmit}>
      <ShareAccessBody
        error={error}
        hasPassword={hasPassword}
        id={id}
        message={message}
        pending={pending}
        target={target}
        workspaceId={workspaceId}
        onClose={onClose}
      >
        {children}
      </ShareAccessBody>
    </Form.Context>
  );
}
