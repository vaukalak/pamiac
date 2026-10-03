import { ConnectAccountCopy } from "@/components/connect/connect-account-copy";

interface Properties {
  connectedAt: string | null;
  email: string;
  name: string;
}

function accountInitial(name: string, email: string) {
  const source = name.trim() || email.trim();
  return Array.from(source)[0]?.toLocaleUpperCase("en") ?? "";
}

function connectedWhen(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function ConnectAccountRow(props: Properties) {
  const { connectedAt, email, name } = props;
  const when = connectedWhen(connectedAt);
  const visibleName = name.trim();

  return (
    <div className="token-connect-account">
      <span aria-hidden="true" className="token-connect-avatar">
        {accountInitial(visibleName, email)}
      </span>
      <ConnectAccountCopy email={email} name={visibleName} />
      {when ? <span className="token-connect-when">{when}</span> : null}
    </div>
  );
}
