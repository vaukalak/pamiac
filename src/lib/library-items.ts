import type { BoardDocument } from "@/components/library/board-document";

export const libraryItemsQueryKey = ["library", "items"] as const;

export async function fetchLibraryItems(): Promise<BoardDocument[]> {
  const response = await fetch("/api/documents");
  if (!response.ok) throw new Error("Could not load the library");
  const body = (await response.json()) as { documents?: BoardDocument[] };
  if (!Array.isArray(body.documents)) throw new Error("Could not load the library");
  return body.documents;
}

export function libraryItemsQueryOptions() {
  return {
    queryKey: libraryItemsQueryKey,
    queryFn: fetchLibraryItems,
    refetchOnWindowFocus: true,
    staleTime: 0,
    refetchOnMount: false,
  };
}
