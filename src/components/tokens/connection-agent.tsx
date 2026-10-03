import { ConnectPromptText } from "@/components/connect/connect-prompt-text";
import { ConnectionSkillActions } from "@/components/tokens/connection-skill-actions";
import { PAMIAC_SKILL_URL } from "@/lib/connect-platforms";
import { Paragraph } from "@/ui/Paragraph";

export function ConnectionAgent() {
  return (
    <div className="token-connect-agent">
      <h3>Agent skill</h3>
      <Paragraph>
        The Pamiac skill teaches your agent how to work safely with notes and diagrams. It does not
        contain credentials.
      </Paragraph>
      <ConnectPromptText text={PAMIAC_SKILL_URL} />
      <ConnectionSkillActions />
    </div>
  );
}
