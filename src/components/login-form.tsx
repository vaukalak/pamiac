"use client";

import { useLayoutEffect, useState } from "react";
import { LoginChooser } from "@/components/login/login-chooser";
import { LoginMagicLinkForm } from "@/components/login/login-magic-link-form";
import { LoginPasswordForm } from "@/components/login/login-password-form";
import { readSentLoginAddress } from "@/lib/login-sent-memory";

interface Properties {
  agentConnect: boolean;
  googleEnabled: boolean;
  nextPath: string;
  showDevLink: boolean;
}

type LoginStep = "chooser" | "magic" | "password";

export function LoginForm(props: Properties) {
  const { agentConnect, googleEnabled, nextPath, showDevLink } = props;
  const [step, setStep] = useState<LoginStep>("chooser");

  useLayoutEffect(() => {
    if (!readSentLoginAddress()) return;
    setStep("magic");
  }, []);

  if (step === "magic") {
    return (
      <LoginMagicLinkForm
        nextPath={nextPath}
        onBack={() => {
          setStep("chooser");
        }}
        showDevLink={showDevLink}
      />
    );
  }

  if (step === "password") {
    return (
      <LoginPasswordForm
        nextPath={nextPath}
        onBack={() => {
          setStep("chooser");
        }}
      />
    );
  }

  return (
    <LoginChooser
      agentConnect={agentConnect}
      googleEnabled={googleEnabled}
      nextPath={nextPath}
      onMagicLink={() => {
        setStep("magic");
      }}
      onPassword={() => {
        setStep("password");
      }}
    />
  );
}
