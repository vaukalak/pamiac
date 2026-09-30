interface Properties {
  count: number;
}

export function TokenKeysHeading(props: Properties) {
  const { count } = props;

  return (
    <div className="token-keys-heading">
      <h2>API keys</h2>
      <p className="token-count">{count}</p>
    </div>
  );
}
