"use client";

import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  return (
    <button
      className="btn secondary small"
      onClick={() =>
        authClient.signOut({
          fetchOptions: {
            onSuccess: () => {
              window.location.assign("/");
            },
          },
        })
      }
      type="button"
    >
      Sign out
    </button>
  );
}
