"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { tokensQueryOptions } from "@/components/tokens/tokens-query";
import { connectConsentsQueryOptions } from "@/lib/connect-consents-query";
import { tokenReachesWorkspace } from "@/lib/sidebar-connections";

interface Properties {
  workspaceId: string;
}

export function LibraryConnectAgentLink(props: Properties) {
  const { workspaceId } = props;
  const pathname = usePathname();
  const tokens = useQuery(tokensQueryOptions());
  const account = useQuery(connectConsentsQueryOptions());
  const current = pathname === "/connect/agent";
  const ready = tokens.isSuccess && account.isSuccess;
  const reaches = tokens.data?.some((token) => tokenReachesWorkspace(token, workspaceId)) ?? false;
  const consented = (account.data?.connections.length ?? 0) > 0;
  const recommended = ready && !reaches && !consented;

  return (
    <Link
      aria-current={current ? "page" : undefined}
      className="library-nav-item"
      href="/connect/agent"
    >
      Connect agent
      {recommended ? <span className="library-nav-note">Recommended</span> : null}
    </Link>
  );
}
