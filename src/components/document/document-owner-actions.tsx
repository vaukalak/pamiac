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
      <Button
        className="danger icon-button"
        disabled={remove.isPending}
        onClick={onDelete}
        type="button"
      >
        <svg
          aria-hidden="true"
          fill="none"
          height="16"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.75"
          viewBox="0 0 16 16"
          width="16"
        >
          <path d="M3.5 4.5h9" />
          <path d="M6.5 4.2V3.4A1 1 0 0 1 7.5 2.4h1a1 1 0 0 1 1 1v.8" />
          <path d="M4.4 4.5 5 13h6l.6-8.5" />
          <path d="M7 7v3.5" />
          <path d="M9 7v3.5" />
        </svg>
        <span className="visually-hidden">{remove.isPending ? "Deleting…" : "Delete"}</span>
      </Button>
      {message ? <Alert>{message}</Alert> : null}
    </div>
  );
}
