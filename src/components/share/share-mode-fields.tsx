"use client";

import { useFormContext } from "react-hook-form";
import type { ShareDraft } from "@/components/share/share-draft";
import { ShareEmailsField } from "@/components/share/share-emails-field";
import { SharePasswordField } from "@/components/share/share-password-field";

interface Properties {
  hasPassword: boolean;
}

export function ShareModeFields(props: Properties) {
  const { hasPassword } = props;
  const { watch } = useFormContext<ShareDraft>();
  const mode = watch("visibility");
  if (mode === "emails") return <ShareEmailsField />;
  if (mode === "password") return <SharePasswordField hasPassword={hasPassword} />;
  return null;
}
