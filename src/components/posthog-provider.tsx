"use client";

import { PostHogProvider as PostHogClientProvider } from "@posthog/react";
import posthog from "posthog-js";
import { useEffect, type ReactNode } from "react";
import { authClient } from "@/lib/auth-client";
import { posthogBrowserOptions, posthogHost, posthogKey } from "@/lib/analytics";

interface Properties {
  children: ReactNode;
}

export function PostHogProvider(props: Properties) {
  const { children } = props;
  const session = authClient.useSession();
  const userId = session.data?.user?.id;

  useEffect(() => {
    const key = posthogKey();
    if (!key) return;
    posthog.init(key, posthogBrowserOptions(posthogHost()));
  }, []);

  useEffect(() => {
    if (!posthogKey() || session.isPending) return;
    if (userId) posthog.identify(userId);
    else posthog.reset();
  }, [session.isPending, userId]);

  return <PostHogClientProvider client={posthog}>{children}</PostHogClientProvider>;
}
