export const LIBRARY_FILTER_KEY = "pamiac-library-filter";
export const LIBRARY_PANEL_KEY = "pamiac-library-panel";
export const OPEN_LIBRARY_KEY = "pamiac-open-library";
export const OPEN_LIBRARY_PENDING = "\u0000";

const openLibraryListeners = new Set<() => void>();

export function subscribeOpenLibrary(onStoreChange: () => void) {
  openLibraryListeners.add(onStoreChange);

  function onStorage(event: StorageEvent) {
    if (event.key !== OPEN_LIBRARY_KEY) return;
    onStoreChange();
  }

  window.addEventListener("storage", onStorage);
  return () => {
    openLibraryListeners.delete(onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function openLibrarySnapshot() {
  return window.localStorage.getItem(OPEN_LIBRARY_KEY);
}

export function openLibraryServerSnapshot() {
  return OPEN_LIBRARY_PENDING;
}

export function publishOpenLibrary() {
  for (const onStoreChange of openLibraryListeners) onStoreChange();
}

export function libraryFilter(stored: string | null): "all" | "note" | "diagram" {
  if (stored === "all" || stored === "note" || stored === "diagram") return stored;
  return "all";
}

export function libraryPanel(stored: string | null): "dashboard" | "manage" {
  if (stored === "dashboard" || stored === "manage") return stored;
  return "dashboard";
}
