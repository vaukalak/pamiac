"use client";

import { useMutation } from "@tanstack/react-query";
import { ConnectReturned } from "@/components/connect/connect-returned";
import { Alert } from "@/ui/Alert";
import { Button } from "@/ui/Button";
import { PageTitle } from "@/ui/PageTitle";
import { Paragraph } from "@/ui/Paragraph";
import { Section } from "@/ui/Section";

interface Properties {
  agentName: string;
  connectId: string;
}

async function postReturn(connectId: string) {
  const response = await fetch(`/api/agent/v1/connect/${encodeURIComponent(connectId)}/return`, {
    method: "POST",
  });
  const body = (await response.json().catch(() => null)) as {
    error?: string;
    status?: string;
  } | null;
  if (!response.ok || body?.status !== "ready") {
    throw new Error(body?.error ?? "Could not return to the agent");
  }
}

export function ConnectReturnOffer(props: Properties) {
  const { agentName, connectId } = props;
  const mutation = useMutation({
    mutationFn: () => postReturn(connectId),
  });
  const error = mutation.error instanceof Error ? mutation.error.message : "";

  if (mutation.isSuccess) {
    return (
      <Section className="home-sign-in-panel">
        <ConnectReturned agentName={agentName} />
      </Section>
    );
  }

  return (
    <Section className="home-sign-in-panel">
      <PageTitle title={agentName} />
      <Paragraph>Authorizing gives {agentName} this account's notes and diagrams.</Paragraph>
      <Button
        disabled={mutation.isPending}
        onClick={() => {
          mutation.mutate();
        }}
        type="button"
      >
        {`Return to ${agentName}`}
      </Button>
      {error ? <Alert>{error}</Alert> : null}
    </Section>
  );
}
