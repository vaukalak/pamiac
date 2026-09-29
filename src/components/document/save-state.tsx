"use client";

import { useIsMutating, useQuery } from "@tanstack/react-query";
import {
  documentEditKey,
  documentSaveKey,
  type DocumentEditStatus,
} from "@/components/document/document-client";

interface Properties {
  id: string;
  canEdit: boolean;
}

function label(
  canEdit: boolean,
  pending: number,
  title: DocumentEditStatus,
  body: DocumentEditStatus,
) {
  if (!canEdit) return "View only";
  if (pending > 0 || title === "dirty" || body === "dirty") return "Saving…";
  if (title === "error" || body === "error") return "Not saved";
  return "Saved";
}

export function SaveState(props: Properties) {
  const { id, canEdit } = props;
  const pending = useIsMutating({ mutationKey: documentSaveKey(id) });
  const title = useQuery({
    queryKey: documentEditKey(id, "title"),
    queryFn: async () => "clean" as DocumentEditStatus,
    enabled: false,
    initialData: "clean" as DocumentEditStatus,
  });
  const body = useQuery({
    queryKey: documentEditKey(id, "body"),
    queryFn: async () => "clean" as DocumentEditStatus,
    enabled: false,
    initialData: "clean" as DocumentEditStatus,
  });

  return <span className="save-state">{label(canEdit, pending, title.data, body.data)}</span>;
}
