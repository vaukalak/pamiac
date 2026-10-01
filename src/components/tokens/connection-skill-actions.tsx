"use client";

import { useState } from "react";
import { TOKEN_SKILL_FILE } from "@/components/tokens/token-skill";
import { Alert } from "@/ui/Alert";
import { Button } from "@/ui/Button";

export function ConnectionSkillActions() {
  const [message, setMessage] = useState("");

  async function copySkill() {
    setMessage("");
    try {
      await navigator.clipboard.writeText(TOKEN_SKILL_FILE);
      setMessage("Skill copied.");
    } catch {
      setMessage("Could not copy the skill.");
    }
  }

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
      <Button className="secondary" onClick={() => void copySkill()} type="button">
        Copy skill
      </Button>
      <Button className="secondary" onClick={downloadSkill} type="button">
        Download SKILL.md
      </Button>
      {message === "Could not copy the skill." ? <Alert>{message}</Alert> : null}
      {message === "Skill copied." ? (
        <p className="text-pretty" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
