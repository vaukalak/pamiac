import { PageTitle } from "@/ui/PageTitle";
import { Paragraph } from "@/ui/Paragraph";

export function ResetPasswordPrompt() {
  return (
    <div className="login-sign-in-copy">
      <PageTitle title="Set a new password" />
      <Paragraph>Choose a password for this account.</Paragraph>
    </div>
  );
}
