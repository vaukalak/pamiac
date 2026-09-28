interface Properties {
  id: string;
  name: string;
  tokenPrefix: string;
  secret: string | null;
  lastUsedAt: string | null;
  revokedAt: string | null;
  onRevoked: () => void;
}

export function TokenRow(props: Properties) {
  const { id, name, tokenPrefix, secret, lastUsedAt, revokedAt, onRevoked } = props;
  const status = revokedAt
    ? "revoked"
    : lastUsedAt
      ? `used ${new Date(lastUsedAt).toLocaleString()}`
      : "never used";

  async function revoke() {
    await fetch(`/api/tokens?id=${id}`, { method: "DELETE" });
    onRevoked();
  }

  return (
    <div className="token-row">
      <strong>{name}</strong>
      {revokedAt ? null : (
        <button className="btn danger small" onClick={() => void revoke()} type="button">
          Revoke
        </button>
      )}
      <div className="hint">
        {tokenPrefix}… · {status}
      </div>
      {secret && !revokedAt ? <div className="secret">{secret}</div> : null}
    </div>
  );
}
