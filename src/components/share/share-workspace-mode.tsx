"use client";

import { useQuery } from "@tanstack/react-query";
import { useFormContext } from "react-hook-form";
import type { ShareDraft } from "@/components/share/share-draft";
import { ShareModeOption } from "@/components/share/share-mode-option";
import { openWorkspaceName } from "@/lib/library-spaces";
import { workspacesQueryOptions } from "@/lib/library-workspaces";

interface Properties {
  workspaceId: string;
}

export function ShareWorkspaceMode(props: Properties) {
  const { workspaceId } = props;
  const { watch } = useFormContext<ShareDraft>();
  const mode = watch("visibility");
  const workspaces = useQuery(workspacesQueryOptions());
  const workspaceName = openWorkspaceName(workspaceId, workspaces.data);
  if (!workspaceName) return null;

  return (
    <ShareModeOption
      checked={mode === "workspace"}
      detail="Everyone in that workspace can open it."
      icon="people"
      title={`Anyone in ${workspaceName}`}
      value="workspace"
    />
  );
}
