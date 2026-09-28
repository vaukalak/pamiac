interface Properties {
  secret: string;
}

export function TokenSecret(props: Properties) {
  const { secret } = props;

  return (
    <div className="token-secret">
      <p>Copy this key now. Pamiac will not show it again.</p>
      <div className="secret">{secret}</div>
    </div>
  );
}
