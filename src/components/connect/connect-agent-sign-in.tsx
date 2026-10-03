import Link from "next/link";
import { PageTitle } from "@/ui/PageTitle";
import { Paragraph } from "@/ui/Paragraph";

export function ConnectAgentSignIn() {
  return (
    <div className="token-connect-sign-in">
      <PageTitle
        subtitle="Use your Pamiac notes and diagrams from your favorite AI."
        title="Connect Pamiac"
      />
      <Paragraph>Sign in to choose Cursor, Claude, ChatGPT, or another agent.</Paragraph>
      <Link className="btn library-lime" href="/login?next=/connect/agent">
        Sign in
      </Link>
    </div>
  );
}
