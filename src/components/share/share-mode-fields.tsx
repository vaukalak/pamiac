import type { Visibility } from "@/lib/access";
import { ShareEmailsField } from "@/components/share/share-emails-field";
import { SharePasswordField } from "@/components/share/share-password-field";

interface Properties {
  emailText: string;
  hasPassword: boolean;
  mode: Visibility;
  password: string;
  onEmailText: (value: string) => void;
  onPassword: (value: string) => void;
}

export function ShareModeFields(props: Properties) {
  const { emailText, hasPassword, mode, password, onEmailText, onPassword } = props;
  if (mode === "emails") {
    return <ShareEmailsField onChange={onEmailText} value={emailText} />;
  }
  if (mode === "password") {
    return <SharePasswordField hasPassword={hasPassword} onChange={onPassword} value={password} />;
  }
  return null;
}
