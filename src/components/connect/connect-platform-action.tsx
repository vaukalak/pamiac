import { ConnectCopyAction } from "@/components/connect/connect-copy-action";
import { ConnectCursorInstall } from "@/components/connect/connect-cursor-install";
import { AGENT_SETUP_PROMPT, type ConnectPlatform } from "@/lib/connect-platforms";

interface Properties {
  platform: ConnectPlatform;
}

export function ConnectPlatformAction(props: Properties) {
  const { platform } = props;
  if (platform.id === "cursor") return <ConnectCursorInstall />;

  return (
    <ConnectCopyAction
      className="library-lime"
      failure="Could not copy the prompt."
      label={platform.primaryLabel}
      success="Prompt copied."
      text={AGENT_SETUP_PROMPT}
    />
  );
}
