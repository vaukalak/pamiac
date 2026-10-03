export const AGENT_CONNECT_URL = "https://pamiac.com/connect/agent";

export const AGENT_CONNECT_LABEL = "pamiac.com/connect/agent";

export const AGENT_SETUP_PROMPT = `Connect yourself to Pamiac using these instructions: ${AGENT_CONNECT_URL}`;

export const CURSOR_MCP_URL = "https://pamiac.com/api/mcp";

export const CONNECT_PLATFORMS = [
  {
    id: "cursor",
    name: "Cursor",
    blurb: "Recommended",
    layout: "stack",
    recommended: true,
    lead: "Connect Pamiac to Cursor in one click.",
    subtitle:
      "Cursor will add Pamiac as an MCP connection and ask you to sign in with your Pamiac account.",
    checklist: [
      "Secure sign-in with your Pamiac account",
      "Access your Pamiac notes and diagrams",
      "No API key required",
      "Works with Cursor and Cursor Cloud",
    ],
    primaryLabel: "Add Pamiac to Cursor",
    showOr: true,
    linkPlacement: "after-action",
    selfServe: "Let Cursor configure itself",
  },
  {
    id: "claude",
    name: "Claude",
    blurb: "Web, Desktop, Code",
    layout: "columns",
    recommended: false,
    lead: "",
    subtitle: "Works with Claude Web, Desktop and Claude Code.",
    checklist: [
      "No API key required",
      "Add Pamiac as a custom connector",
      "Secure sign-in with your Pamiac account",
      "Access your notes and diagrams",
    ],
    primaryLabel: "Copy setup prompt",
    showOr: false,
    linkPlacement: "before-action",
    selfServe: "Let Claude configure itself",
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    blurb: "Plugin & MCP",
    layout: "columns",
    recommended: false,
    lead: "",
    subtitle: "Use Pamiac with ChatGPT.",
    checklist: [
      "Create, search and edit your notes and diagrams",
      "Secure sign-in with your Pamiac account",
      "Works in ChatGPT, Codex and GPTs",
    ],
    primaryLabel: "Copy setup prompt",
    showOr: true,
    linkPlacement: "after-action",
    selfServe: "Let ChatGPT configure itself",
  },
  {
    id: "gemini",
    name: "Gemini",
    blurb: "Connected app",
    layout: "stack",
    recommended: false,
    lead: "",
    subtitle: "Add Pamiac as a Gemini connected app.",
    checklist: [
      "Secure sign-in with your Pamiac account",
      "Access your notes and diagrams",
      "No API key required for the connected app",
    ],
    primaryLabel: "Copy setup prompt",
    showOr: true,
    linkPlacement: "after-action",
    selfServe: "Let Gemini configure itself",
  },
  {
    id: "grok",
    name: "Grok",
    blurb: "Custom connector",
    layout: "stack",
    recommended: false,
    lead: "",
    subtitle: "Add Pamiac as a custom connector.",
    checklist: [
      "Secure sign-in with your Pamiac account",
      "Access your notes and diagrams",
      "Use an API token when OAuth is not available",
    ],
    primaryLabel: "Copy setup prompt",
    showOr: true,
    linkPlacement: "after-action",
    selfServe: "Let Grok configure itself",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    blurb: "Harness & more",
    layout: "stack",
    recommended: false,
    lead: "",
    subtitle: "Add Pamiac in the DeepSeek harness.",
    checklist: ["Secure sign-in with your Pamiac account", "Access your notes and diagrams"],
    primaryLabel: "Copy setup prompt",
    showOr: true,
    linkPlacement: "after-action",
    selfServe: "Let DeepSeek configure itself",
  },
  {
    id: "other",
    name: "Other agent",
    blurb: "Any MCP client",
    layout: "stack",
    recommended: false,
    lead: "",
    subtitle: "Use Pamiac from any MCP client.",
    checklist: [
      "Secure sign-in with your Pamiac account",
      "Access your notes and diagrams",
      "Works with any MCP client",
    ],
    primaryLabel: "Copy setup prompt",
    showOr: true,
    linkPlacement: "after-action",
    selfServe: "Let this agent configure itself",
  },
] as const;

export type ConnectPlatform = (typeof CONNECT_PLATFORMS)[number];

export type ConnectPlatformId = ConnectPlatform["id"];

const PLATFORM_HOSTS: readonly (readonly [string, Exclude<ConnectPlatformId, "other">])[] = [
  ["cursor.com", "cursor"],
  ["cursor.sh", "cursor"],
  ["claude.ai", "claude"],
  ["anthropic.com", "claude"],
  ["chatgpt.com", "chatgpt"],
  ["openai.com", "chatgpt"],
  ["gemini.google.com", "gemini"],
  ["deepseek.com", "deepseek"],
  ["x.ai", "grok"],
  ["grok.com", "grok"],
];

export function connectPlatform(id: ConnectPlatformId): ConnectPlatform {
  const platform = CONNECT_PLATFORMS.find((item) => item.id === id);
  if (!platform) return CONNECT_PLATFORMS[0];
  return platform;
}

export function connectTokenName(id: ConnectPlatformId) {
  return `${connectPlatform(id).name} on this computer`;
}

export function cursorInstallUrl() {
  const config = btoa(JSON.stringify({ url: CURSOR_MCP_URL }));
  return `cursor://anysphere.cursor-deeplink/mcp/install?name=Pamiac&config=${config}`;
}

export function platformFromClientId(clientId: string): Exclude<ConnectPlatformId, "other"> | null {
  const trimmed = clientId.trim().toLowerCase();
  if (!trimmed) return null;
  let host = trimmed;
  try {
    host = new URL(trimmed).hostname.toLowerCase();
  } catch {
    host = trimmed;
  }
  for (const [needle, platform] of PLATFORM_HOSTS) {
    if (host === needle || host.endsWith(`.${needle}`)) return platform;
  }
  return null;
}

export function connectAccessLabel(workspaceCount: number) {
  if (workspaceCount === 1) return "Personal space and 1 workspace";
  return `Personal space and ${workspaceCount} workspaces`;
}
