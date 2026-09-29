import type { Visibility } from "@/lib/access";

export type ShareResult = {
  visibility: Visibility;
  emails: string[];
  hasPassword: boolean;
  workspaceId: string | null;
};
