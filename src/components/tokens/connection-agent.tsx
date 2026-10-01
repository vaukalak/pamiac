import { ConnectionSkillActions } from "@/components/tokens/connection-skill-actions";
import { Paragraph } from "@/ui/Paragraph";

export function ConnectionAgent() {
  return (
    <div className="token-connect-agent">
      <h3>Give your agent the Pamiac skill</h3>
      <Paragraph>These are instructions for documents in the spaces the key can reach.</Paragraph>
      <Paragraph>PAMIAC_TOKEN has to be configured in the environment.</Paragraph>
      <ConnectionSkillActions />
      <Paragraph>The skill contains instructions, not credentials.</Paragraph>
    </div>
  );
}
