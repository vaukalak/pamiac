export function libraryQueryMatches(title: string, preview: string, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return title.toLowerCase().includes(needle) || preview.toLowerCase().includes(needle);
}

export function libraryTypeCounts(documents: readonly { type: string }[]) {
  return {
    all: documents.length,
    note: documents.filter((document) => document.type === "note").length,
    diagram: documents.filter((document) => document.type === "diagram").length,
  };
}
