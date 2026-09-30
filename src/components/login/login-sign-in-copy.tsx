import { PageTitle } from "@/ui/PageTitle";
import { Paragraph } from "@/ui/Paragraph";

export function LoginSignInCopy() {
  return (
    <div className="login-sign-in-copy">
      <PageTitle eyebrow="Notes, UML, and agents" title="Sign in or register" />
      <Paragraph className="lede">
        We email you a link. There is no password. If the address is new, opening the link creates
        the account.
      </Paragraph>
    </div>
  );
}
