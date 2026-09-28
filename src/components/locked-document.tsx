"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LockedDocument({
  id,
  reason,
}: {
  id: string;
  reason: "password" | "login" | "email";
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function unlock(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    const response = await fetch(`/api/documents/${id}/unlock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setPending(false);
    if (!response.ok) {
      setError("That password does not open this document.");
      return;
    }
    router.refresh();
  }

  return (
    <main className="auth-wrap">
      <section className="auth-card">
        <p className="eyebrow">Shared document</p>
        {reason === "password" ? (
          <>
            <h1>Password required</h1>
            <p>The owner protected this note or diagram with a password.</p>
            <form className="form-stack" onSubmit={unlock}>
              <div>
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>
              <button className="btn" disabled={pending} type="submit">
                {pending ? "Checking…" : "Open"}
              </button>
              {error ? <p className="error">{error}</p> : null}
            </form>
          </>
        ) : null}
        {reason === "login" ? (
          <>
            <h1>Sign in to view</h1>
            <p>This document is shared with specific email addresses.</p>
            <Link className="btn" href={`/login?next=/d/${id}`}>
              Continue with email
            </Link>
          </>
        ) : null}
        {reason === "email" ? (
          <>
            <h1>This account does not have access</h1>
            <p>Ask the owner to add your email, or open the link while signed in as an invited person.</p>
            <Link className="btn secondary" href="/workspace">
              Back to your library
            </Link>
          </>
        ) : null}
      </section>
    </main>
  );
}
