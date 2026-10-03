import { Paragraph } from "@/ui/Paragraph";

export function ConnectTokenExample() {
  return (
    <div className="token-connect-guide token-connect-token-example">
      <Paragraph>PAMIAC_TOKEN=pam_...</Paragraph>
      <Paragraph>{"Authorization: Bearer <PAMIAC_TOKEN>"}</Paragraph>
    </div>
  );
}
