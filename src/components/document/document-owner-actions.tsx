"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Alert } from "@/ui/Alert";
import { Button } from "@/ui/Button";

interface Properties {
  id: string;
  onShare: () => void;
}

async function deleteDocument(id: string) {
  const response = await fetch(`/api/documents/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Could not delete this document.");
}

export function DocumentOwnerActions(props: Properties) {
  const { id, onShare } = props;
  const router = useRouter();
  const remove = useMutation({
    mutationFn: () => deleteDocument(id),
    onSuccess: () => {
      router.push("/workspace");
    },
  });

  function onDelete() {
    if (!window.confirm("Delete this document?")) return;
    remove.mutate();
  }

  const message = remove.error instanceof Error ? remove.error.message : "";

  return (
    <div className="row-actions">
      <Button className="secondary small" onClick={onShare} type="button">
        Share
      </Button>
      <Button className="danger small" disabled={remove.isPending} onClick={onDelete} type="button">
        {remove.isPending ? "Deleting…" : "Delete"}
      </Button>
      {message ? <Alert>{message}</Alert> : null}
    </div>
  );
}
