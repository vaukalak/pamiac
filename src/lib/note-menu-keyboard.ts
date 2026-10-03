export const NOTE_MENU_SELECTOR = [
  ".bn-suggestion-menu",
  ".bn-drag-handle-menu",
  ".note-turn-into-menu",
  ".bn-color-picker-dropdown",
  ".bn-menu-dropdown",
  ".bn-select",
].join(", ");

export const FORMATTING_TOOLBAR_MENU_SELECTOR = [
  ".bn-select",
  ".bn-menu-dropdown",
  ".bn-color-picker-dropdown",
].join(", ");

const RESUME_EDITING_SELECTOR = [
  ".bn-suggestion-menu-item",
  ".note-turn-into-menu .bn-menu-item",
  ".bn-select .mantine-Menu-item",
  ".bn-color-picker",
  ".bn-color-picker-dropdown",
].join(", ");

let resumeEditing = false;

export function armResumeEditing() {
  resumeEditing = true;
}

export function cancelResumeEditing() {
  resumeEditing = false;
}

export function consumeResumeEditing() {
  const resume = resumeEditing;
  resumeEditing = false;
  return resume;
}

export function inputModeWhileMenu(menuOpen: boolean, narrow: boolean) {
  if (menuOpen && narrow) return "none";
  return null;
}

export function focusAfterMenuClose(resume: boolean) {
  if (resume) return "focus" as const;
  return "blur" as const;
}

export function pointerResumesEditing(target: EventTarget | null) {
  const element = eventElement(target);
  if (!element) return false;
  return element.closest(RESUME_EDITING_SELECTOR) !== null;
}

export function formattingToolbarMenuOpen() {
  for (const node of document.querySelectorAll(FORMATTING_TOOLBAR_MENU_SELECTOR)) {
    if (!(node instanceof HTMLElement)) continue;
    if (node.closest(".note-editor, .bn-drag-handle-menu, .note-turn-into-menu")) continue;
    if (node.getClientRects().length === 0) continue;
    return true;
  }
  return false;
}

export const MOBILE_SHEET_SELECTOR = [
  ".bn-suggestion-menu",
  ".bn-select",
  ".bn-color-picker-dropdown",
  ".note-turn-into-menu",
  ".bn-drag-handle-menu",
].join(", ");

export function noteMenuOpen() {
  return document.querySelector(NOTE_MENU_SELECTOR) !== null;
}

export function mobileSheetOpen() {
  return document.querySelector(MOBILE_SHEET_SELECTOR) !== null;
}

export function keyboardInset(
  innerHeight: number,
  viewport: { height: number; offsetTop: number } | null,
) {
  if (!viewport) return 0;
  return Math.max(0, Math.round(innerHeight - viewport.offsetTop - viewport.height));
}

export function keyboardCoversViewport(
  viewportHeight: number,
  largestViewportHeight: number,
  inset: number,
) {
  return inset > 0 || largestViewportHeight - viewportHeight > 150;
}

export function hideSoftwareKeyboard() {
  const keyboard = (navigator as Navigator & { virtualKeyboard?: { hide?: () => void } })
    .virtualKeyboard;
  keyboard?.hide?.();
}

function eventElement(target: EventTarget | null) {
  if (target instanceof Element) return target;
  if (target instanceof Text) return target.parentElement;
  return null;
}
