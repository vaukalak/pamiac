interface Properties {
  email: string;
  name: string;
}

export function ConnectAccountCopy(props: Properties) {
  const { email, name } = props;

  return (
    <span className="token-connect-account-copy">
      {name ? <span>{name}</span> : null}
      <span>{email}</span>
    </span>
  );
}
