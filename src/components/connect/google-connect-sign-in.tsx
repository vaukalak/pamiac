import { LoginGoogle } from "@/components/login/login-google";
import { LoginPassword } from "@/components/login/login-password";
import { googleConnectPath } from "@/lib/google-agent-login-code";
import { googleSignInEnabled } from "@/lib/google-sign-in";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  userCode: string;
}

export function GoogleConnectSignIn(props: Properties) {
  const { userCode } = props;
  const nextPath = googleConnectPath(userCode);

  return (
    <>
      {googleSignInEnabled() ? (
        <LoginGoogle agentConnect nextPath={nextPath} />
      ) : (
        <Paragraph>Google sign-in is not set up.</Paragraph>
      )}
      <LoginPassword nextPath={nextPath} />
    </>
  );
}
