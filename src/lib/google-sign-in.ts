interface GoogleCredentials {
  clientId: string;
  clientSecret: string;
}

function googleCredentials(): GoogleCredentials | null {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim() ?? "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() ?? "";
  if (clientId === "" || clientSecret === "") return null;
  return { clientId, clientSecret };
}

export function googleSignInEnabled() {
  return googleCredentials() !== null;
}

export function googleSocialProviders() {
  const credentials = googleCredentials();
  if (!credentials) return undefined;
  return {
    google: {
      clientId: credentials.clientId,
      clientSecret: credentials.clientSecret,
      prompt: "select_account" as const,
    },
  };
}
