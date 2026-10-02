"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Alert } from "@/ui/Alert";
import { Button } from "@/ui/Button";
import { PageTitle } from "@/ui/PageTitle";
import { Paragraph } from "@/ui/Paragraph";
import { Section } from "@/ui/Section";

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

export function RequestPermissions(props: Properties) {
  const { id } = props;
  const request = useQuery({
    queryKey: ["documents", id, "permission-request"],
    queryFn: () => readRequest(id),
  });
  const mutation = useMutation({
    mutationFn: () => sendRequest(id),
  });
  const sent = request.data?.requested === true || mutation.isSuccess;
  const message = mutation.error instanceof Error ? mutation.error.message : "";

  return (
    <Section className="document-gate">
      <PageTitle title="Request permissions" />
      <Paragraph>This document is private.</Paragraph>
      <Button
        disabled={sent || mutation.isPending}
        onClick={() => {
          if (sent || mutation.isPending) return;
          mutation.mutate();
        }}
        type="button"
      >
        {sent ? "Request sent" : mutation.isPending ? "Sending…" : "Request permissions"}
      </Button>
      {message ? <Alert>{message}</Alert> : null}
      {sent ? <Paragraph>The owner has this request.</Paragraph> : null}
    </Section>
  );
}
