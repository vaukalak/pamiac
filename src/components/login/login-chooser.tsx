"use client";

import { LoginGoogle } from "@/components/login/login-google";
import { LoginSignInCopy } from "@/components/login/login-sign-in-copy";
import { Button } from "@/ui/Button";

interface Properties {
  agentConnect: boolean;
  googleEnabled: boolean;
  nextPath: string;
  onMagicLink: () => void;
  onPassword: () => void;
}

export function LoginChooser(props: Properties) {
  const { agentConnect, googleEnabled, nextPath, onMagicLink, onPassword } = props;

  return (
    <div className="login-chooser form-stack">
      <LoginSignInCopy />
      {googleEnabled ? <LoginGoogle agentConnect={agentConnect} nextPath={nextPath} /> : null}
      <Button onClick={onMagicLink} type="button">
        Send Magic Link
      </Button>
      <Button className="ghost login-link-option" onClick={onPassword} type="button">
        Or continue with email / password
      </Button>
    </div>
  );
}
