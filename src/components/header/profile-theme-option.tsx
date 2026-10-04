"use client";

import type { ThemeChoice } from "@/lib/theme";

interface Properties {
  choice: ThemeChoice;
  label: string;
  selected: boolean;
  onSelect: (choice: ThemeChoice) => void;
}

export function ProfileThemeOption(props: Properties) {
  const { choice, label, selected, onSelect } = props;

  return (
    <button
      aria-checked={selected}
      className="profile-theme-option"
      data-choice={choice}
      onClick={() => onSelect(choice)}
      role="radio"
      tabIndex={selected ? 0 : -1}
      type="button"
    >
      {label}
    </button>
  );
}
