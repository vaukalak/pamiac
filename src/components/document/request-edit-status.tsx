import { Alert } from "@/ui/Alert";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  message: string;
  sent: boolean;
}

export function RequestEditStatus(props: Properties) {
  const { message, sent } = props;
  if (message) return <Alert>{message}</Alert>;
  if (sent) return <Paragraph className="hint">The owner has this request.</Paragraph>;
  return null;
}
