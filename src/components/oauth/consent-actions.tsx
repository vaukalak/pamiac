"use client";

import { useMutation } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { oauthRedirectTarget } from "@/lib/oauth-return";
import { Button } from "@/ui/Button";

export function ConsentActions() {
  const decision = useMutation({
    mutationFn: async (accept: boolean) => {
      const result = await authClient.oauth2.consent({ accept });
      if (result.error) {
        throw new Error(result.error.message ?? "Could not finish connecting");
      }
      const url = oauthRedirectTarget(result.data);
      if (!url) throw new Error("Could not finish connecting");
      return url;
    },
    onSuccess: (url) => {
      window.location.assign(url);
    },
  });

  return (
    <div className="form-stack">
      <Button
        className="library-lime"
        disabled={decision.isPending}
        onClick={() => decision.mutate(true)}
        type="button"
      >
        {decision.isPending ? "Working…" : "Allow"}
      </Button>
      <Button
        className="secondary"
        disabled={decision.isPending}
        onClick={() => decision.mutate(false)}
        type="button"
      >
        Deny
      </Button>
      {decision.isError ? <p className="error">{decision.error.message}</p> : null}
    </div>
  );
}
