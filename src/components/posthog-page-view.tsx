"use client";

import { usePostHog } from "@posthog/react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { pageViewUrl, posthogKey } from "@/lib/analytics";

export function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthog = usePostHog();

  useEffect(() => {
    if (!posthogKey() || !pathname) return;
    posthog.capture("$pageview", {
      $current_url: pageViewUrl(window.location.origin, pathname, searchParams.toString()),
    });
  }, [pathname, posthog, searchParams]);

  return null;
}
