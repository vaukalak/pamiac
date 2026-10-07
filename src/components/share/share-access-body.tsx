"use client";

import type { ReactNode } from "react";
import { useFormContext } from "react-hook-form";
import { ShareAccessFooter } from "@/components/share/share-access-footer";
import type { ShareDraft } from "@/components/share/share-draft";
import { ShareDialogHeading } from "@/components/share/share-dialog-heading";
import { ShareDialogHint } from "@/components/share/share-dialog-hint";
import { ShareLink } from "@/components/share/share-link";
import { ShareModeFields } from "@/components/share/share-mode-fields";
import { ShareModeList } from "@/components/share/share-mode-list";

interface Properties {
  children: ReactNode;
  error: string;
  hasPassword: boolean;
  id: string;
  message: string;
  pending: boolean;
  target: "document" | "folder";
  workspaceId: string | null;
  onClose: () => void;
}

export function ShareAccessBody(props: Properties) {
  const { children, error, hasPassword, id, message, pending, target, workspaceId, onClose } =
    props;
  const { watch } = useFormContext<ShareDraft>();
  const mode = watch("visibility");

  return (
    <>
      <ShareDialogHeading onClose={onClose} />
      <ShareDialogHint />
      <ShareModeList workspaceId={workspaceId} />
      <ShareModeFields hasPassword={hasPassword} />
      <ShareLink id={id} key={mode} mode={mode} path={target === "folder" ? "f" : "d"} />
      <ShareAccessFooter error={error} message={message} pending={pending}>
        {children}
      </ShareAccessFooter>
    </>
  );
}
