export const LIBRARY_FILTER_KEY = "pamiac-library-filter";
export const LIBRARY_PANEL_KEY = "pamiac-library-panel";
export const OPEN_LIBRARY_KEY = "pamiac-open-library";

export function libraryFilter(stored: string | null): "all" | "note" | "diagram" {
  if (stored === "all" || stored === "note" || stored === "diagram") return stored;
  return "all";
}

export function libraryPanel(stored: string | null): "dashboard" | "manage" {
  if (stored === "dashboard" || stored === "manage") return stored;
  return "dashboard";
}
