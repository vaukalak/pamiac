"use client";

import type { KeyboardEvent } from "react";
import { ProfileThemeOption } from "@/components/header/profile-theme-option";
import { themeChoices, writeThemeChoice, type ThemeChoice } from "@/lib/theme";
import { useThemeChoice } from "@/lib/use-theme-choice";

const labels: Record<ThemeChoice, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

export function ProfileTheme() {
  const choice = useThemeChoice();

  function onKeyDown(event: KeyboardEvent<HTMLFieldSetElement>) {
    const current = themeChoices.indexOf(choice);
    let nextIndex = current;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (current + 1) % themeChoices.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (current + themeChoices.length - 1) % themeChoices.length;
    } else {
      return;
    }
    event.preventDefault();
    const next = themeChoices[nextIndex];
    writeThemeChoice(next);
    event.currentTarget.querySelector<HTMLButtonElement>(`[data-choice="${next}"]`)?.focus();
  }

  return (
    <fieldset className="profile-theme" onKeyDown={onKeyDown} role="radiogroup">
      <legend className="profile-theme-legend">Theme</legend>
      {themeChoices.map((item) => (
        <ProfileThemeOption
          choice={item}
          key={item}
          label={labels[item]}
          onSelect={writeThemeChoice}
          selected={item === choice}
        />
      ))}
    </fieldset>
  );
}
