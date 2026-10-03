"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { connectAccessLabel } from "@/lib/connect-platforms";
import { PERSONAL_SPACE_ID } from "@/lib/library-spaces";
import { workspacesQueryOptions } from "@/lib/library-workspaces";
import { Paragraph } from "@/ui/Paragraph";

export function ConnectAccessSummary() {
  const spaces = useQuery(workspacesQueryOptions());
  if (!spaces.data) return null;
  const workspaceCount = spaces.data.filter((item) => item.id !== PERSONAL_SPACE_ID).length;

  return (
    <div className="token-connect-access">
      <Paragraph>Access</Paragraph>
      <Paragraph>{connectAccessLabel(workspaceCount)}</Paragraph>
      <Link className="btn secondary" href="/workspace/tokens">
        Manage access
      </Link>
    </div>
  );
}
