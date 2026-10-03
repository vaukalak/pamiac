"use client";

import { ConnectCopyAction } from "@/components/connect/connect-copy-action";
import { TOKEN_SKILL_FILE } from "@/components/tokens/token-skill";
import { Button } from "@/ui/Button";

export function ConnectionSkillActions() {
  function downloadSkill() {
    const file = new Blob([TOKEN_SKILL_FILE], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "SKILL.md";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="skill-actions">
      <ConnectCopyAction label="Copy skill" text={TOKEN_SKILL_FILE} />
      <Button className="secondary" onClick={downloadSkill} type="button">
        Download SKILL.md
      </Button>
    </div>
  );
}
