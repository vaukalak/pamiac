import { Paragraph } from "@/ui/Paragraph";
import { Section } from "@/ui/Section";

export function WorkspaceMembersPersonal() {
  return (
    <Section className="workspace-settings-card">
      <Paragraph>A personal space has no shared members.</Paragraph>
      <Paragraph>It cannot be renamed, left, or deleted.</Paragraph>
    </Section>
  );
}
