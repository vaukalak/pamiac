"use client";

import { useMutation } from "@tanstack/react-query";
import { LoginGoogleAgentCopy } from "@/components/login/login-google-agent-copy";
import { LoginSendFailure } from "@/components/login/login-send-failure";
import { authClient } from "@/lib/auth-client";
import { loginAnnouncement } from "@/lib/login-announcement";
import { loginSendFailureSentence } from "@/lib/login-send-failure";
import { Button } from "@/ui/Button";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  agentConnect: boolean;
  nextPath: string;
}

const GOOGLE_FAILURE = "We could not open Google.";

async function startGoogleSignIn(nextPath: string) {
  let result: Awaited<ReturnType<typeof authClient.signIn.social>>;
  try {
    result = await authClient.signIn.social({
      provider: "google",
      callbackURL: nextPath,
    });
  } catch (error) {
    throw new Error(
      loginSendFailureSentence(error instanceof Error ? error.message : undefined, GOOGLE_FAILURE),
    );
  }
  if (result.error) {
    throw new Error(loginSendFailureSentence(result.error.message, GOOGLE_FAILURE));
  }
}

export function LoginGoogle(props: Properties) {
  const { agentConnect, nextPath } = props;
  const mutation = useMutation({
    mutationFn: () => startGoogleSignIn(nextPath),
  });
  const message = mutation.error instanceof Error ? mutation.error.message : "";
  const announcement = loginAnnouncement({
    status: mutation.isError ? "error" : "idle",
    addressError: "",
    failure: message,
    address: "",
  });

  function authorize() {
    mutation.mutate();
  }

  return (
    <div className="login-google form-stack">
      {agentConnect ? (
        <LoginGoogleAgentCopy />
      ) : (
        <Paragraph>This Google account opens the desk.</Paragraph>
      )}
      <div aria-atomic="true" aria-live="polite" className="login-announcement">
        {announcement}
      </div>
      <Button disabled={mutation.isPending} onClick={authorize} type="button">
        <svg aria-hidden="true" focusable="false" height="18" viewBox="0 0 48 48" width="18">
          <path
            d="M43.6 20.5H24.5v7.1h11c-1 4.6-5 8-11 8-6.4 0-11.6-5.2-11.6-11.6S18.1 12.4 24.5 12.4c2.9 0 5.5 1.1 7.5 2.8l5.1-5.1C33.6 6.8 29.3 5 24.5 5 14 5 5.5 13.5 5.5 24S14 43 24.5 43c10.1 0 17.5-7.1 17.5-17.1 0-1.2-.1-2.3-.4-3.4z"
            fill="currentColor"
          />
        </svg>
        {agentConnect ? "Authorize with Google" : "Continue with Google"}
      </Button>
      {mutation.isError ? <LoginSendFailure happened={message} /> : null}
    </div>
  );
}
