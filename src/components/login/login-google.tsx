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
        {agentConnect ? "Authorize with Google" : "Continue with Google"}
      </Button>
      {mutation.isError ? <LoginSendFailure happened={message} /> : null}
    </div>
  );
}
