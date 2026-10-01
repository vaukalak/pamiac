"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tokensQueryKey } from "@/components/tokens/tokens-query";
import { Alert } from "@/ui/Alert";
import { Button } from "@/ui/Button";

interface Properties {
  id: string;
}

async function revokeToken(id: string) {
  const response = await fetch(`/api/tokens?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  if (!response.ok) throw new Error(body?.error ?? "Could not revoke this key");
}

export function TokenRevoke(props: Properties) {
  const { id } = props;
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => revokeToken(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tokensQueryKey });
    },
  });
  const error = mutation.error instanceof Error ? mutation.error.message : null;

  return (
    <div className="token-revoke">
      <Button
        className="danger small"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate()}
        type="button"
      >
        {mutation.isPending ? "Revoking…" : "Revoke key"}
      </Button>
      {error ? <Alert>{error}</Alert> : null}
    </div>
  );
}
