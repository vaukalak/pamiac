"use client";

import { useFormContext } from "react-hook-form";
import type { ShareDraft } from "@/components/share/share-draft";
import { ShareModeOption } from "@/components/share/share-mode-option";

const MODES = [
  {
    detail: "Only you can open it.",
    icon: "lock",
    title: "Only me",
    value: "private",
  },
  {
    detail: "Invited people sign in with that email to view.",
    icon: "mail",
    title: "By email",
    value: "emails",
  },
  {
    detail: "Anyone with the link and the password can view.",
    icon: "key",
    title: "By password",
    value: "password",
  },
  {
    detail: "Anyone with the link can view.",
    icon: "globe",
    title: "Public",
    value: "public",
  },
] as const;

export function ShareModeList() {
  const { watch } = useFormContext<ShareDraft>();
  const mode = watch("visibility");

  return (
    <fieldset className="share-modes">
      <legend>Who can open this document</legend>
      {MODES.map((item) => (
        <ShareModeOption
          checked={mode === item.value}
          detail={item.detail}
          icon={item.icon}
          key={item.value}
          title={item.title}
          value={item.value}
        />
      ))}
    </fieldset>
  );
}
