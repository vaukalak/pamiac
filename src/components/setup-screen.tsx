export function SetupScreen({ detail }: { detail?: string }) {
  return (
    <main className="setup">
      <p className="eyebrow">Database</p>
      <h1>Connect Neon before signing in</h1>
      <p>
        Accounts, notes, diagrams, share settings, and embeddings live in Postgres. Copy{" "}
        <code>.env.example</code> to <code>.env.local</code>, set <code>DATABASE_URL</code> and{" "}
        <code>BETTER_AUTH_SECRET</code>, then run <code>npm run db:push</code>.
      </p>
      {detail ? <p className="error">{detail}</p> : null}
    </main>
  );
}
