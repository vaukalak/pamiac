import { Button } from "@/ui/Button";

interface Properties {
  onOpen: () => void;
}

export function ConnectAdvancedEntry(props: Properties) {
  const { onOpen } = props;

  return (
    <div className="token-connect-advanced-entry">
      <Button className="secondary" onClick={onOpen} type="button">
        Advanced: API token, manual MCP, agent skill
      </Button>
    </div>
  );
}
