"use client";

import { useMutation } from "@tanstack/react-query";
import { Alert } from "@/ui/Alert";
import { Button } from "@/ui/Button";
import { PageTitle } from "@/ui/PageTitle";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  userCode: string;
}

async function sendDecision(userCode: string, decision: "approve" | "deny") {
  const response = await fetch("/api/connect/google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userCode, decision }),
  });
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  if (!response.ok) {
    throw new Error(body?.error || "Could not update this connection.");
  }
}

export function GoogleConnectDecision(props: Properties) {
  const { userCode } = props;
  const mutation = useMutation({
    mutationFn: (decision: "approve" | "deny") => sendDecision(userCode, decision),
  });
  const message = mutation.error instanceof Error ? mutation.error.message : "";
  const settled = mutation.isPending || mutation.isSuccess;
  const outcome =
    mutation.isSuccess && mutation.variables === "approve"
      ? "Connected. Return to the agent."
      : "Denied. The agent will stop.";

  return (
    <div className="form-stack">
      <PageTitle title="Connect this agent" subtitle="Match the code, then connect or deny." />
      <Paragraph>Connect lets this agent search, read, and edit your notes and diagrams.</Paragraph>
      <Paragraph>{userCode ? `User code ${userCode}` : "The link has no user code."}</Paragraph>
      <Button disabled={settled} onClick={() => mutation.mutate("approve")} type="button">
        Connect
      </Button>
      <Button
        className="ghost"
        disabled={settled}
        onClick={() => mutation.mutate("deny")}
        type="button"
      >
        Deny
      </Button>
      {message ? <Alert>{message}</Alert> : null}
      {mutation.isSuccess ? <Paragraph>{outcome}</Paragraph> : null}
    </div>
  );
}
