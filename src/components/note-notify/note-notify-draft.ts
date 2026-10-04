export const NOTE_NOTIFY_MODES = [
  { value: "never", label: "never" },
  { value: "any", label: "any change" },
  { value: "criteria", label: "when matching criteria" },
] as const;

export type NoteNotifyMode = (typeof NOTE_NOTIFY_MODES)[number]["value"];

export interface NoteNotifyDraft {
  mode: NoteNotifyMode;
  criteria: string;
}
