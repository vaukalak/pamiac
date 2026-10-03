import { ConnectCheckItem } from "@/components/connect/connect-check-item";

interface Properties {
  items: readonly string[];
}

export function ConnectChecklist(props: Properties) {
  const { items } = props;

  return (
    <ul className="token-connect-checks">
      {items.map((item) => (
        <ConnectCheckItem key={item} label={item} />
      ))}
    </ul>
  );
}
