import { ConnectNextStep } from "@/components/connect/connect-next-step";

interface Properties {
  platformName: string;
}

export function ConnectNextList(props: Properties) {
  const { platformName } = props;

  return (
    <ol>
      <ConnectNextStep
        detail="Try: Find my notes about checkout"
        title={`Open ${platformName} and start using Pamiac`}
      />
      <ConnectNextStep
        detail="This helps the agent follow best practices for editing."
        skill
        title="Optional: install the Pamiac skill"
      />
    </ol>
  );
}
