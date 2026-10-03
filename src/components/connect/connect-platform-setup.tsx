import { ConnectChatGptSetup } from "@/components/connect/connect-chatgpt-setup";
import { ConnectClaudeSetup } from "@/components/connect/connect-claude-setup";
import { ConnectCursorSetup } from "@/components/connect/connect-cursor-setup";
import { ConnectDeepSeekSetup } from "@/components/connect/connect-deepseek-setup";
import { ConnectGeminiSetup } from "@/components/connect/connect-gemini-setup";
import { ConnectGrokSetup } from "@/components/connect/connect-grok-setup";
import { ConnectOtherSetup } from "@/components/connect/connect-other-setup";
import type { ConnectPlatform } from "@/lib/connect-platforms";

interface Properties {
  onAdvanced: () => void;
  onManual: () => void;
  platform: ConnectPlatform;
}

export function ConnectPlatformSetup(props: Properties) {
  const { onAdvanced, onManual, platform } = props;
  if (platform.id === "claude") {
    return <ConnectClaudeSetup onAdvanced={onAdvanced} platform={platform} />;
  }
  if (platform.id === "cursor") {
    return <ConnectCursorSetup onAdvanced={onAdvanced} onManual={onManual} platform={platform} />;
  }
  if (platform.id === "chatgpt") return <ConnectChatGptSetup onAdvanced={onAdvanced} />;
  if (platform.id === "gemini") return <ConnectGeminiSetup onAdvanced={onAdvanced} />;
  if (platform.id === "grok") return <ConnectGrokSetup onAdvanced={onAdvanced} />;
  if (platform.id === "deepseek") return <ConnectDeepSeekSetup onAdvanced={onAdvanced} />;
  return <ConnectOtherSetup onAdvanced={onAdvanced} />;
}
