import { LoginGoogle } from "@/components/login/login-google";
import { googleConnectPath } from "@/lib/google-agent-login-code";
import { googleSignInEnabled } from "@/lib/google-sign-in";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  userCode: string;
}

export function GoogleConnectSignIn(props: Properties) {
  const { userCode } = props;

  if (!googleSignInEnabled()) {
    return <Paragraph>Google sign-in is not set up.</Paragraph>;
  }

  return <LoginGoogle agentConnect nextPath={googleConnectPath(userCode)} />;
}
