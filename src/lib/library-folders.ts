import type { FolderRecord } from "@/lib/folder-library";

export const libraryFoldersQueryKey = ["library", "folders"] as const;

export async function fetchLibraryFolders(): Promise<FolderRecord[]> {
  const response = await fetch("/api/folders");
  if (!response.ok) throw new Error("Could not load folders");
  const body = (await response.json()) as { folders?: FolderRecord[] };
  if (!Array.isArray(body.folders)) throw new Error("Could not load folders");
  return body.folders;
}

export function libraryFoldersQueryOptions() {
  return {
    queryKey: libraryFoldersQueryKey,
    queryFn: fetchLibraryFolders,
    refetchOnWindowFocus: true,
    staleTime: 0,
    refetchOnMount: false,
  };
}
