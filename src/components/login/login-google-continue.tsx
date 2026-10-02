"use client";

import { useMutation } from "@tanstack/react-query";
import { LoginSendFailure } from "@/components/login/login-send-failure";
import { authClient } from "@/lib/auth-client";
import { loginSendFailureSentence } from "@/lib/login-send-failure";
import { Button } from "@/ui/Button";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  nextPath: string;
}

function googleFailure(message: string | undefined) {
  if (!message || /provider not found/i.test(message)) {
    return "Google sign-in is not available yet.";
  }
  return loginSendFailureSentence(message);
}

async function continueWithGoogle(nextPath: string) {
  let result: Awaited<ReturnType<typeof authClient.signIn.social>>;
  try {
    result = await authClient.signIn.social({
      provider: "google",
      callbackURL: nextPath,
    });
  } catch (error) {
    throw new Error(googleFailure(error instanceof Error ? error.message : undefined));
  }
  if (result.error) {
    throw new Error(googleFailure(result.error.message));
  }
}

export function LoginGoogleContinue(props: Properties) {
  const { nextPath } = props;
  const mutation = useMutation({
    mutationFn: () => continueWithGoogle(nextPath),
  });
  const message = mutation.error instanceof Error ? mutation.error.message : "";

  return (
    <>
      <Paragraph>This Google account opens the desk.</Paragraph>
      <Button disabled={mutation.isPending} onClick={() => mutation.mutate()} type="button">
        <svg aria-hidden="true" focusable="false" height="18" viewBox="0 0 48 48" width="18">
          <path
            d="M43.6 20.5H24.5v7.1h11c-1 4.6-5 8-11 8-6.4 0-11.6-5.2-11.6-11.6S18.1 12.4 24.5 12.4c2.9 0 5.5 1.1 7.5 2.8l5.1-5.1C33.6 6.8 29.3 5 24.5 5 14 5 5.5 13.5 5.5 24S14 43 24.5 43c10.1 0 17.5-7.1 17.5-17.1 0-1.2-.1-2.3-.4-3.4z"
            fill="currentColor"
          />
        </svg>
        Continue with Google
      </Button>
      {mutation.isError ? <LoginSendFailure happened={message} /> : null}
    </>
  );
}
