"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { identifySignedInUser } from "@/lib/posthog-browser";

interface Properties {}

export function PostHogIdentify(props: Properties) {
  const {} = props;
  const session = authClient.useSession();
  const userId = session.data?.user.id;
  const email = session.data?.user.email;

  useEffect(() => {
    identifySignedInUser({ id: userId, email });
  }, [email, userId]);

  return null;
}
