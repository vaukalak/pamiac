import { CheckItem } from "@/ui/CheckItem";

export function ConsentCapabilities() {
  return (
    <ul className="token-connect-checks">
      <CheckItem label="Search notes and diagrams" />
      <CheckItem label="Read documents" />
      <CheckItem label="Create documents" />
      <CheckItem label="Edit documents" />
    </ul>
  );
}
