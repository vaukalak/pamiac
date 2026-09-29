"use client";

import { useMutation } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { oauthRedirectTarget } from "@/lib/oauth-return";

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
      <button
        className="btn"
        type="button"
        disabled={decision.isPending}
        onClick={() => decision.mutate(true)}
      >
        {decision.isPending ? "Working…" : "Allow"}
      </button>
      <button
        className="btn secondary"
        type="button"
        disabled={decision.isPending}
        onClick={() => decision.mutate(false)}
      >
        Deny
      </button>
      {decision.isError ? <p className="error">{decision.error.message}</p> : null}
    </div>
  );
}
