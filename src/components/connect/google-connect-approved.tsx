"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Alert } from "@/ui/Alert";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  userCode: string;
}

async function readGoogleConnection(userCode: string) {
  const params = new URLSearchParams({ userCode });
  const response = await fetch(`/api/connect/google?${params}`);
  const body = (await response.json().catch(() => null)) as {
    error?: string;
    connected?: boolean;
  } | null;
  if (!response.ok) {
    throw new Error(body?.error || "Could not check this connection.");
  }
  return { connected: body?.connected === true };
}

export function GoogleConnectApproved(props: Properties) {
  const { userCode } = props;
  const status = useQuery({
    queryKey: ["connect-google", userCode],
    queryFn: () => readGoogleConnection(userCode),
    refetchInterval: (query) => (query.state.data?.connected ? false : 3_000),
    refetchIntervalInBackground: true,
  });
  const message = status.error instanceof Error ? status.error.message : "";

  useEffect(() => {
    if (!status.data?.connected) return;
    window.close();
  }, [status.data?.connected]);

  return (
    <>
      <Paragraph>Connected. Return to the agent.</Paragraph>
      {message ? <Alert>{message}</Alert> : null}
    </>
  );
}
