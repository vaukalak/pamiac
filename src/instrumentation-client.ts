import posthog from "posthog-js";
import { posthogBrowserOptions, posthogHost, posthogKey } from "@/lib/analytics-public";

const key = posthogKey();
if (key) posthog.init(key, posthogBrowserOptions(posthogHost()));
