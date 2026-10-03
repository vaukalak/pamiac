"use client";

import { useLayoutEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm, type FieldErrors, type Resolver } from "react-hook-form";
import { LoginLinkSent } from "@/components/login/login-link-sent";
import { LoginSendFailure } from "@/components/login/login-send-failure";
import { authClient } from "@/lib/auth-client";
import { loginAnnouncement } from "@/lib/login-announcement";
import { loginSendFailureSentence } from "@/lib/login-send-failure";
import {
  forgetSentLoginAddress,
  readSentLoginAddress,
  rememberSentLoginAddress,
} from "@/lib/login-sent-memory";
import { Button } from "@/ui/Button";
import { Form } from "@/ui/Form";

interface Properties {
  nextPath: string;
  onBack: () => void;
  showDevLink: boolean;
}

interface LoginValues {
  email: string;
}

interface SentLink {
  address: string;
  devUrl: string | null;
}

function loginEmailMessage(email: string) {
  if (email.includes("@")) return "";
  if (email.trim() === "") return "Enter an email address.";
  return "That address needs an @.";
}

const loginResolver: Resolver<LoginValues> = (values) => {
  const message = loginEmailMessage(values.email);
  if (!message) return { values, errors: {} };
  const errors: FieldErrors<LoginValues> = {
    email: { type: "validate", message },
  };
  return { values: {}, errors };
};

async function sendMagicLink(input: { email: string; nextPath: string; showDevLink: boolean }) {
  const { email, nextPath, showDevLink } = input;
  let result: Awaited<ReturnType<typeof authClient.signIn.magicLink>>;
  try {
    result = await authClient.signIn.magicLink({
      email,
      name: email.split("@")[0] || "User",
      callbackURL: nextPath,
    });
  } catch (error) {
    throw new Error(loginSendFailureSentence(error instanceof Error ? error.message : undefined));
  }
  if (result.error) {
    throw new Error(loginSendFailureSentence(result.error.message));
  }
  rememberSentLoginAddress(email);
  if (!showDevLink) return { devUrl: null };
  try {
    const dev = await fetch(`/api/dev/magic-link?email=${encodeURIComponent(email)}`);
    if (!dev.ok) return { devUrl: null };
    const body = (await dev.json()) as { url?: string };
    return { devUrl: body.url ?? null };
  } catch {
    return { devUrl: null };
  }
}

export function LoginMagicLinkForm(props: Properties) {
  const { nextPath, onBack, showDevLink } = props;
  const form = useForm<LoginValues>({
    defaultValues: { email: "" },
    mode: "onSubmit",
    reValidateMode: "onChange",
    resolver: loginResolver,
  });
  const [sent, setSent] = useState<SentLink | null>(null);
  const mutation = useMutation({
    mutationFn: (email: string) => sendMagicLink({ email, nextPath, showDevLink }),
    onSuccess: (result, email) => {
      setSent({ address: email, devUrl: result.devUrl });
    },
  });

  useLayoutEffect(() => {
    const remembered = readSentLoginAddress();
    if (!remembered) return;
    setSent({ address: remembered, devUrl: null });
  }, []);

  function chooseDifferentEmail() {
    forgetSentLoginAddress();
    form.reset({ email: "" });
    mutation.reset();
    setSent(null);
  }

  const email = sent?.address ?? form.watch("email");
  const fieldError = form.formState.errors.email?.message;
  const addressError = sent ? "" : typeof fieldError === "string" ? fieldError : "";
  const message = mutation.error instanceof Error ? mutation.error.message : "";
  const status = sent
    ? "sent"
    : mutation.isPending
      ? "sending"
      : mutation.isError
        ? "error"
        : "idle";

  const announcement = loginAnnouncement({
    status,
    addressError,
    failure: message,
    address: email,
  });

  return (
    <>
      <div aria-atomic="true" aria-live="polite" className="login-announcement">
        {announcement}
      </div>
      {sent ? (
        <LoginLinkSent
          address={sent.address}
          devUrl={sent.devUrl}
          onChooseDifferentEmail={chooseDifferentEmail}
        />
      ) : (
        <Form.Context
          className="form-stack"
          form={form}
          onSubmit={(values) => {
            mutation.mutate(values.email);
          }}
        >
          <Button className="ghost" onClick={onBack} type="button">
            Back
          </Button>
          <Form.Input autoComplete="email" label="Email" name="email" type="email" />
          <Button disabled={mutation.isPending} type="submit">
            {mutation.isPending ? "Sending link…" : "Email me a link"}
          </Button>
          {mutation.isError && !addressError ? <LoginSendFailure happened={message} /> : null}
        </Form.Context>
      )}
    </>
  );
}
