import { Alert } from "@/ui/Alert";

interface Properties {
  happened: string;
}

export function LoginSendFailure(props: Properties) {
  const { happened } = props;

  return (
    <Alert>
      {happened}
      <br />
      Try again, or use another address.
    </Alert>
  );
}
