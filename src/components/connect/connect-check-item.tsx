interface Properties {
  label: string;
}

export function ConnectCheckItem(props: Properties) {
  const { label } = props;

  return (
    <li className="token-connect-check">
      <svg aria-hidden="true" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="7" />
        <path d="M4.5 8.2 7 10.6 11.5 5.6" />
      </svg>
      <span>{label}</span>
    </li>
  );
}
