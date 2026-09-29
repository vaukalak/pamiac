"use client";

import { useLayoutEffect, useState } from "react";
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

interface Properties {
  nextPath: string;
}

export function LoginForm(props: Properties) {
  const { nextPath } = props;
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const [devUrl, setDevUrl] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
  const addressRejected = attempted && !email.includes("@");
  const addressError = !addressRejected
    ? ""
    : email.trim() === ""
      ? "Enter an email address."
      : "That address needs an @.";

  useLayoutEffect(() => {
    const remembered = readSentLoginAddress();
    if (!remembered) return;
    setEmail(remembered);
    setStatus("sent");
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setAttempted(true);
    if (!email.includes("@")) {
      setStatus("idle");
      setMessage("");
      setDevUrl(null);
      return;
    }
    setStatus("sending");
    setMessage("");
    setDevUrl(null);
    let result: Awaited<ReturnType<typeof authClient.signIn.magicLink>>;
    try {
      result = await authClient.signIn.magicLink({
        email,
        name: email.split("@")[0] || "User",
        callbackURL: nextPath,
      });
    } catch (error) {
      setStatus("error");
      setMessage(loginSendFailureSentence(error instanceof Error ? error.message : undefined));
      return;
    }
    if (result.error) {
      setStatus("error");
      setMessage(loginSendFailureSentence(result.error.message));
      return;
    }
    rememberSentLoginAddress(email);
    setStatus("sent");
    const dev = await fetch(`/api/dev/magic-link?email=${encodeURIComponent(email)}`);
    if (dev.ok) {
      const body = (await dev.json()) as { url?: string };
      setDevUrl(body.url ?? null);
    }
  }

  function chooseDifferentEmail() {
    forgetSentLoginAddress();
    setEmail("");
    setMessage("");
    setDevUrl(null);
    setStatus("idle");
    setAttempted(false);
  }

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
      {status === "sent" ? (
        <LoginLinkSent
          address={email}
          devUrl={devUrl}
          onChooseDifferentEmail={chooseDifferentEmail}
        />
      ) : (
        <form className="form-stack" noValidate onSubmit={onSubmit}>
          <div>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              aria-invalid={addressRejected}
              aria-describedby={addressError ? "login-email-error" : undefined}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            {addressError ? (
              <p id="login-email-error" className="login-email-error">
                {addressError}
              </p>
            ) : null}
          </div>
          <button className="btn" disabled={status === "sending"} type="submit">
            {status === "sending" ? "Sending link…" : "Email me a link"}
          </button>
          {status === "error" && !addressRejected ? <LoginSendFailure happened={message} /> : null}
        </form>
      )}
    </>
  );
}
