import posthog from "posthog-js";
import { posthogHostFrom, posthogProjectTokenFrom } from "@/lib/posthog-identity";

const token = posthogProjectTokenFrom(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN);

if (token) {
  posthog.init(token, {
    api_host: posthogHostFrom(process.env.NEXT_PUBLIC_POSTHOG_HOST),
    defaults: "2026-05-30",
  });
}
