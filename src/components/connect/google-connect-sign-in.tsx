"use client";

import { useState } from "react";
import { LoginGoogle } from "@/components/login/login-google";
import { LoginPasswordForm } from "@/components/login/login-password-form";
import { googleConnectPath } from "@/lib/google-agent-login-code";
import { googleSignInEnabled } from "@/lib/google-sign-in";
import { Button } from "@/ui/Button";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  userCode: string;
}

export function GoogleConnectSignIn(props: Properties) {
  const { userCode } = props;
  const nextPath = googleConnectPath(userCode);
  const [showPassword, setShowPassword] = useState(false);

  if (showPassword) {
    return (
      <LoginPasswordForm
        nextPath={nextPath}
        onBack={() => {
          setShowPassword(false);
        }}
      />
    );
  }

  return (
    <>
      {googleSignInEnabled() ? (
        <LoginGoogle agentConnect nextPath={nextPath} />
      ) : (
        <Paragraph>Google sign-in is not set up.</Paragraph>
      )}
      <Button
        className="ghost login-link-option"
        onClick={() => {
          setShowPassword(true);
        }}
        type="button"
      >
        Or continue with email / password
      </Button>
    </>
  );
}
