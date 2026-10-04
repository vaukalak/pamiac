"use client";

import { useSyncExternalStore } from "react";
import {
  readThemeChoice,
  resolvedSchemeServerSnapshot,
  resolvedSchemeSnapshot,
  subscribeResolvedScheme,
  subscribeThemeChoice,
  type ColorScheme,
  type ThemeChoice,
} from "@/lib/theme";

function themeServerSnapshot(): ThemeChoice {
  return "system";
}

export function useThemeChoice(): ThemeChoice {
  return useSyncExternalStore(subscribeThemeChoice, readThemeChoice, themeServerSnapshot);
}

export function useResolvedScheme(): ColorScheme {
  return useSyncExternalStore(
    subscribeResolvedScheme,
    resolvedSchemeSnapshot,
    resolvedSchemeServerSnapshot,
  );
}
