export function remoteNoteMarkdown(input: {
  dirty: boolean;
  saveInFlight: boolean;
  localMarkdown: string;
  remoteMarkdown: string;
  remoteVersion: number;
  appliedVersion: number;
}) {
  if (input.saveInFlight || input.dirty || input.remoteVersion <= input.appliedVersion) {
    return {
      markdown: input.localMarkdown,
      version: input.appliedVersion,
      replace: false,
    };
  }
  return {
    markdown: input.remoteMarkdown,
    version: input.remoteVersion,
    replace: true,
  };
}

export function remoteNoteTitle(input: {
  titleDirty: boolean;
  saveInFlight: boolean;
  localTitle: string;
  remoteTitle: string;
  remoteVersion: number;
  appliedVersion: number;
}) {
  if (input.saveInFlight || input.titleDirty || input.remoteVersion <= input.appliedVersion) {
    return input.localTitle;
  }
  return input.remoteTitle;
}

export function noteSaveGate(input: {
  dirty: boolean;
  titleDirty: boolean;
  canEdit: boolean;
  uploadHeld: boolean;
  saveInFlight: boolean;
}): "clean" | "pause" | "debounce" {
  if (!input.dirty && !input.titleDirty) return "clean";
  if (!input.canEdit || input.uploadHeld || input.saveInFlight) return "pause";
  return "debounce";
}

export function noteConflictAction(input: {
  uploadHeld: boolean;
  dirty: boolean;
  titleDirty: boolean;
}): "settle" | "defer" | "publish" {
  if (!input.dirty && !input.titleDirty) return "settle";
  if (input.uploadHeld) return "defer";
  return "publish";
}
