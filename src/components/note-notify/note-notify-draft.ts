export const NOTE_NOTIFY_CHOICES = [
  {
    detail: "Don't notify me about changes to this note.",
    title: "Never",
    value: "never",
  },
  {
    detail: "Notify me whenever this note changes.",
    title: "Any change",
    value: "any",
  },
  {
    detail: "Notify me only when the note matches a condition you describe.",
    title: "When matching criteria",
    value: "criteria",
  },
] as const;

export type NoteNotifyMode = (typeof NOTE_NOTIFY_CHOICES)[number]["value"];

export interface NoteNotifyDraft {
  mode: NoteNotifyMode;
  criteria: string;
}
