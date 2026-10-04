export const themeStorageKey = "theme";

export const themeChoices = ["light", "dark", "system"] as const;

export type ThemeChoice = (typeof themeChoices)[number];

export type ColorScheme = "light" | "dark";

export function isThemeChoice(value: unknown): value is ThemeChoice {
  return value === "light" || value === "dark" || value === "system";
}

export function themeChoiceFromStorage(stored: string | null): ThemeChoice {
  return isThemeChoice(stored) ? stored : "system";
}

export function dataThemeAttribute(choice: ThemeChoice): ColorScheme | null {
  if (choice === "system") return null;
  return choice;
}

export function resolvedScheme(choice: ThemeChoice, prefersDark: boolean): ColorScheme {
  if (choice === "light" || choice === "dark") return choice;
  return prefersDark ? "dark" : "light";
}

export function readThemeChoice(): ThemeChoice {
  try {
    return themeChoiceFromStorage(localStorage.getItem(themeStorageKey));
  } catch {
    return "system";
  }
}

export function applyThemeChoice(choice: ThemeChoice) {
  const root = document.documentElement;
  const value = dataThemeAttribute(choice);
  if (value === null) root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", value);
}

export function writeThemeChoice(choice: ThemeChoice) {
  try {
    localStorage.setItem(themeStorageKey, choice);
  } catch {
    // The session can still follow the choice when storage is blocked.
  }
  applyThemeChoice(choice);
  window.dispatchEvent(new Event("theme-change"));
}

export function subscribeThemeChoice(onStoreChange: () => void) {
  function onChange() {
    onStoreChange();
  }
  window.addEventListener("theme-change", onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener("theme-change", onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function subscribeResolvedScheme(onStoreChange: () => void) {
  const query = window.matchMedia("(prefers-color-scheme: dark)");
  const unsubscribe = subscribeThemeChoice(onStoreChange);
  query.addEventListener("change", onStoreChange);
  return () => {
    unsubscribe();
    query.removeEventListener("change", onStoreChange);
  };
}

export function resolvedSchemeSnapshot(): ColorScheme {
  return resolvedScheme(
    readThemeChoice(),
    window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
}

export function resolvedSchemeServerSnapshot(): ColorScheme {
  return "light";
}

export const themeInitScript = `(function(){try{var stored=localStorage.getItem(${JSON.stringify(themeStorageKey)});var root=document.documentElement;if(stored==="light"||stored==="dark")root.setAttribute("data-theme",stored);else root.removeAttribute("data-theme");}catch(e){}})();`;
