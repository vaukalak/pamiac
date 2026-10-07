"use client";

import { useFormContext } from "react-hook-form";
import type { Visibility } from "@/lib/access";
import type { ShareDraft } from "@/components/share/share-draft";
import { ShareModeCopy } from "@/components/share/share-mode-copy";
import { ShareModeIcon, type ShareModeIconName } from "@/components/share/share-mode-icon";

interface Properties {
  checked: boolean;
  detail: string;
  icon: ShareModeIconName;
  title: string;
  value: Visibility;
}

export function ShareModeOption(props: Properties) {
  const { checked, detail, icon, title, value } = props;
  const { register } = useFormContext<ShareDraft>();

  return (
    <label className={checked ? "choice is-selected" : "choice"}>
      <ShareModeIcon name={icon} />
      <ShareModeCopy detail={detail} title={title} />
      <input {...register("visibility")} checked={checked} type="radio" value={value} />
    </label>
  );
}
