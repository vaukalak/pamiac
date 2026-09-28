"use client";

import { useState } from "react";

interface Properties {
  onCreated: (secret: string) => void;
}

const CHOICES = [
  ["7d", "7 days"],
  ["30d", "30 days"],
  ["90d", "90 days"],
  ["1y", "1 year"],
  ["date", "Custom date"],
  ["never", "No expiration"],
] as const;

type Choice = (typeof CHOICES)[number][0];

export function TokenForm(props: Properties) {
  const { onCreated } = props;
  const [name, setName] = useState("Cloud agent");
  const [choice, setChoice] = useState<Choice>("never");
  const [date, setDate] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    if (choice === "date" && !date) {
      setError("Choose an expiration date");
      return;
    }
    setPending(true);
    setError("");
    const expiration = choice === "date" ? { date } : { preset: choice };
    try {
      const response = await fetch("/api/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, expiration }),
      });
      const body = (await response.json()) as { token?: string; error?: string };
      setPending(false);
      if (!response.ok || !body.token) {
        setError(body.error ?? "Could not create a key");
        return;
      }
      onCreated(body.token);
    } catch {
      setPending(false);
      setError("Could not create a key");
    }
  }

  return (
    <form className="form-stack token-form" onSubmit={(event) => void create(event)}>
      <div>
        <label htmlFor="token-name">Name</label>
        <input id="token-name" onChange={(event) => setName(event.target.value)} value={name} />
      </div>
      <div>
        <label htmlFor="token-expiration">Expiration</label>
        <select
          id="token-expiration"
          onChange={(event) => setChoice(event.target.value as Choice)}
          value={choice}
        >
          {CHOICES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      {choice === "date" ? (
        <div>
          <label htmlFor="token-date">Expiration date</label>
          <input
            id="token-date"
            onChange={(event) => setDate(event.target.value)}
            type="date"
            value={date}
          />
        </div>
      ) : null}
      <button className="btn" disabled={pending} type="submit">
        {pending ? "Creating…" : "Create API key"}
      </button>
      {error ? <p className="error">{error}</p> : null}
    </form>
  );
}
