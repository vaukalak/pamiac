"use client";

import { useState } from "react";
import { LoginPasswordForm } from "@/components/login/login-password-form";
import { Button } from "@/ui/Button";

interface Properties {
  nextPath: string;
}

export function LoginPassword(props: Properties) {
  const { nextPath } = props;
  const [open, setOpen] = useState(false);

  function toggle() {
    setOpen((current) => !current);
  }

  return (
    <div className="form-stack">
      <Button className="ghost" expanded={open} onClick={toggle} type="button">
        Or continue with email and password
      </Button>
      {open ? <LoginPasswordForm nextPath={nextPath} /> : null}
    </div>
  );
}
