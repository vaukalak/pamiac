"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { EditIcon } from "@/components/document/edit-icon";
import { RequestEditStatus } from "@/components/document/request-edit-status";
import { Button } from "@/ui/Button";

interface Properties {
  id: string;
}

interface RequestState {
  requested: boolean;
}

async function readRequest(id: string): Promise<RequestState> {
  const response = await fetch(`/api/documents/${encodeURIComponent(id)}/permission-request`);
  const body = (await response.json().catch(() => null)) as {
    requested?: boolean;
    error?: string;
  } | null;
  if (!response.ok) throw new Error(body?.error ?? "Could not check the request");
  return { requested: body?.requested === true };
}

async function sendRequest(id: string): Promise<RequestState> {
  const response = await fetch(`/api/documents/${encodeURIComponent(id)}/permission-request`, {
    method: "POST",
  });
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  if (!response.ok) throw new Error(body?.error ?? "Could not send the request");
  return { requested: true };
}

function label(sent: boolean, pending: boolean) {
  if (sent) return "Request sent";
  if (pending) return "Sending…";
  return "Require permissions";
}

export function RequestEditButton(props: Properties) {
  const { id } = props;
  const request = useQuery({
    queryKey: ["documents", id, "permission-request"],
    queryFn: () => readRequest(id),
  });
  const mutation = useMutation({
    mutationFn: () => sendRequest(id),
  });
  const sent = request.data?.requested === true || mutation.isSuccess;
  const pending = mutation.isPending;
  const copy = label(sent, pending);
  const message = mutation.error instanceof Error ? mutation.error.message : "";

  return (
    <span className="row-actions">
      <Button
        className="secondary icon-button"
        disabled={sent || pending}
        onClick={() => {
          if (sent || pending) return;
          mutation.mutate();
        }}
        title={copy}
        type="button"
      >
        <EditIcon />
        <span className="visually-hidden">{copy}</span>
      </Button>
      <RequestEditStatus message={message} sent={sent} />
    </span>
  );
}
