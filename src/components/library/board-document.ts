import type { Visibility } from "@/lib/access";
import type { DocumentType } from "@/lib/content";

export type BoardDocument = {
  id: string;
  type: DocumentType;
  title: string;
  content: string;
  visibility: Visibility;
  updatedAt: string;
  version: number;
  hasPassword: boolean;
  emails: string[];
  workspaceId: string | null;
};

export type LibraryView = "grid" | "list";

export type LibraryFilter = "all" | DocumentType;

export type BoardChange =
  | { kind: "delete"; id: string }
  | { kind: "rename"; id: string; title: string }
  | {
      kind: "share";
      id: string;
      visibility: Visibility;
      emails: string[];
      hasPassword: boolean;
      workspaceId: string | null;
    };
