export function isRawNoteView(view: string | string[] | undefined) {
  const value = Array.isArray(view) ? view[0] : view;
  return value === "raw";
}
