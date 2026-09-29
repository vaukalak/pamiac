import { appBaseUrl } from "./config.ts";

export function mcpResourceUrl(base = appBaseUrl()) {
  return `${base.replace(/\/+$/, "")}/api/mcp`;
}
