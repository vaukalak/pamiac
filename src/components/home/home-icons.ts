export type HomeIconName =
  "canvas" | "notes" | "agent" | "home" | "library" | "plus" | "more" | "mark";

/** 24x24 stroke icons shared by the feature cards and the workspace preview. */
export const HOME_ICON_PATHS: Record<HomeIconName, string> = {
  canvas: "M9 3h6v5H9z M3 16h6v5H3z M15 16h6v5h-6z M12 8v4 M6 12h12 M6 12v4 M18 12v4",
  notes: "M7 3h7l4 4v14H7z M14 3v4h4 M10 12h5 M10 16h5",
  agent:
    "M6 9h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1z M9.5 13.5h.01 M14.5 13.5h.01 M12 5v4 M10 4h4 M3 12v3 M21 12v3",
  home: "M4 11l8-7 8 7v9H4z M10 20v-6h4v6",
  library: "M12 3l9 5-9 5-9-5z M3 12l9 5 9-5 M3 16l9 5 9-5",
  plus: "M12 6v12 M6 12h12",
  more: "M6 12h.01 M12 12h.01 M18 12h.01",
  mark: "M6 4h6v9H6z M12 11h6v9h-6z",
};
