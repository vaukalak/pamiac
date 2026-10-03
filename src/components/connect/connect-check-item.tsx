interface Properties {
  label: string;
}

export function ConnectCheckItem(props: Properties) {
  const { label } = props;

  return <li className="token-connect-check">{label}</li>;
}
