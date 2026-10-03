import { Button } from "@/ui/Button";

export type ClaudeConnectMode = "web" | "code";

interface Properties {
  mode: ClaudeConnectMode;
  onMode: (mode: ClaudeConnectMode) => void;
}

export function ConnectClaudeMode(props: Properties) {
  const { mode, onMode } = props;

  return (
    <div aria-label="Claude" className="token-connect-segment" role="group">
      <Button
        className="secondary"
        onClick={() => onMode("web")}
        pressed={mode === "web"}
        type="button"
      >
        Claude Web / Desktop
      </Button>
      <Button
        className="secondary"
        onClick={() => onMode("code")}
        pressed={mode === "code"}
        type="button"
      >
        Claude Code
      </Button>
    </div>
  );
}
