"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const [devUrl, setDevUrl] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("sending");
    setMessage("");
    setDevUrl(null);
    const result = await authClient.signIn.magicLink({
      email,
      name: email.split("@")[0] || "User",
      callbackURL: nextPath,
    });
    if (result.error) {
      setStatus("error");
      setMessage(result.error.message ?? "Could not send the magic link");
      return;
    }
    setStatus("sent");
    const dev = await fetch(`/api/dev/magic-link?email=${encodeURIComponent(email)}`);
    if (dev.ok) {
      const body = (await dev.json()) as { url?: string };
      setDevUrl(body.url ?? null);
    }
  }

  return (
    <form className="form-stack" onSubmit={onSubmit}>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
        />
      </div>
      <button className="btn" disabled={status === "sending"} type="submit">
        {status === "sending" ? "Sending link…" : "Email me a magic link"}
      </button>
      {status === "sent" ? (
        <p className="hint">
          Check your inbox for a sign-in link. New emails are registered the first time the link is
          opened.
        </p>
      ) : null}
      {devUrl ? (
        <a className="dev-link" href={devUrl}>
          Development only: open the magic link
        </a>
      ) : null}
      {status === "error" ? <p className="error">{message}</p> : null}
    </form>
  );
}
