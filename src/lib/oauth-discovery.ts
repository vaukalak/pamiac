export function oauthDiscoveryPaths(resourceUrl: string) {
  const pathname = new URL(resourceUrl).pathname.replace(/\/$/, "");
  return [
    "/.well-known/oauth-protected-resource",
    `/.well-known/oauth-protected-resource${pathname}`,
    "/.well-known/oauth-authorization-server/api/auth",
    "/api/auth/.well-known/openid-configuration",
  ];
}
