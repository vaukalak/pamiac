export const PERSONAL_SPACE_ID = "personal";

export interface LibrarySpace {
  id: string;
  label: string;
}

export function librarySpaces(): LibrarySpace[] {
  return [{ id: PERSONAL_SPACE_ID, label: "Personal space" }];
}

export function documentsInSpace<Document>(
  workspaceId: string,
  documents: readonly Document[],
): readonly Document[] {
  const spaces = librarySpaces();
  const selected = spaces.find((space) => space.id === workspaceId) ?? spaces[0];
  if (selected?.id === PERSONAL_SPACE_ID) return documents;
  return documents;
}
