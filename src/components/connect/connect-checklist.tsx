import { CheckItem } from "@/ui/CheckItem";

interface Properties {
  items: readonly string[];
}

export function ConnectChecklist(props: Properties) {
  const { items } = props;

  return (
    <ul className="token-connect-checks">
      {items.map((item) => (
        <CheckItem key={item} label={item} />
      ))}
    </ul>
  );
}
