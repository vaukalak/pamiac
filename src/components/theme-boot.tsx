"use client";

import { useLayoutEffect } from "react";
import { applyThemeChoice, readThemeChoice } from "@/lib/theme";
import { useThemeChoice } from "@/lib/use-theme-choice";

export function ThemeBoot() {
  const choice = useThemeChoice();

  useLayoutEffect(() => {
    applyThemeChoice(readThemeChoice());
  }, [choice]);

  return null;
}
