"use client";

import { useQuery } from "@tanstack/react-query";
import { documentVersionKey, readDocumentVersion } from "@/components/document/document-client";

export function useDocumentVersion(id: string, enabled: boolean) {
  return useQuery({
    queryKey: documentVersionKey(id),
    queryFn: () => readDocumentVersion(id),
    enabled,
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}
