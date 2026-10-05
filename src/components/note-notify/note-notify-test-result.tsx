import { Alert } from "@/ui/Alert";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  error: string;
  result: string;
}

export function NoteNotifyTestResult(props: Properties) {
  const { error, result } = props;
  if (error) return <Alert>{error}</Alert>;
  if (!result) return null;
  return <Paragraph>{result}</Paragraph>;
}
