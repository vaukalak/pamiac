import Link from "next/link";
import { ConnectPageMark } from "@/components/connect/connect-page-mark";
import { Paragraph } from "@/ui/Paragraph";

export function ConnectAgentSignIn() {
  return (
    <div className="token-connect-sign-in">
      <ConnectPageMark subtitle="Use your Pamiac notes and diagrams from your favorite AI." />
      <Paragraph>Sign in to choose Cursor, Claude, ChatGPT, or another agent.</Paragraph>
      <Link className="btn library-lime" href="/login?next=/connect/agent">
        Sign in
      </Link>
    </div>
  );
}
