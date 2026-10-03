export const NARROW_NOTE_QUERY = "(max-width: 760px)";

export function subscribeNarrowNote(onChange: () => void) {
  const query = window.matchMedia(NARROW_NOTE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export function narrowNoteSnapshot() {
  return window.matchMedia(NARROW_NOTE_QUERY).matches;
}

export function narrowNoteServerSnapshot() {
  return false;
}
