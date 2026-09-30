import { ChatGptConnect } from "@/components/tokens/chatgpt-connect";

export function ConnectionChatGpt() {
  return <ChatGptConnect endpoint="/api/mcp" />;
}
