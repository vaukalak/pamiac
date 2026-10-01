import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  filtered: boolean;
}

export function TokenEmpty(props: Properties) {
  const { filtered } = props;
  const text = filtered ? "No keys match this search." : "No API keys yet.";

  return <Paragraph>{text}</Paragraph>;
}
