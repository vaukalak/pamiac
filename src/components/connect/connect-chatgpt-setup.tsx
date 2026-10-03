import { ConnectChatGptPending } from "@/components/connect/connect-chatgpt-pending";
import { ConnectChatGptPublished } from "@/components/connect/connect-chatgpt-published";
import { CHATGPT_DIRECTORY_STATUS } from "@/lib/connect-platforms";

interface Properties {
  onAdvanced: () => void;
}

export function ConnectChatGptSetup(props: Properties) {
  const { onAdvanced } = props;
  if (CHATGPT_DIRECTORY_STATUS === "pending") {
    return <ConnectChatGptPending onAdvanced={onAdvanced} />;
  }
  return <ConnectChatGptPublished onAdvanced={onAdvanced} />;
}
