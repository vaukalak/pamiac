import { PageTitle } from "@/ui/PageTitle";

interface Properties {
  spaceName: string;
}

export function TokenHeadingCopy(props: Properties) {
  const { spaceName } = props;

  return (
    <div className="library-heading-copy">
      <p className="library-crumb">{spaceName} / Connections & API keys</p>
      <PageTitle
        subtitle="Manage keys for your agents. A key belongs to you. You choose which spaces it can reach."
        title="Connections & API keys"
      />
    </div>
  );
}
