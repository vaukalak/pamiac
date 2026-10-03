export const AGENT_CONNECT_URL = "https://pamiac.com/connect/agent";

export const AGENT_CONNECT_LABEL = "pamiac.com/connect/agent";

export const CONNECT_PLATFORMS = [
  {
    id: "cursor",
    name: "Cursor",
    blurb: "Recommended",
    layout: "stack",
    recommended: true,
    subtitle: "Give Cursor the connect link. It works in Cursor and Cursor Cloud.",
    checklist: [
      "Secure sign-in with your Pamiac account",
      "Give Cursor the connect link",
      "Access your notes and diagrams",
      "Works with Cursor and Cursor Cloud",
    ],
    primaryLabel: "Add Pamiac to Cursor",
    showOr: true,
    linkPlacement: "after-action",
    selfServe: "Let Cursor configure itself",
    selfServeHint: "Give this link to Cursor and ask it to connect.",
    advancedHint: "API token · Manual MCP configuration · Download skill",
  },
  {
    id: "claude",
    name: "Claude",
    blurb: "Web, Desktop, Code",
    layout: "columns",
    recommended: false,
    subtitle: "Works with Claude Web, Desktop and Claude Code.",
    checklist: [
      "Add Pamiac as a custom connector",
      "Secure sign-in with your Pamiac account",
      "Access your notes and diagrams",
      "No API key required",
    ],
    primaryLabel: "Connect Claude",
    showOr: false,
    linkPlacement: "before-action",
    selfServe: "Using Claude Code?",
    selfServeHint: "Give Claude this link and ask it to connect itself.",
    advancedHint: "API token · Manual MCP configuration · Download skill",
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    blurb: "Plugin & MCP",
    layout: "columns",
    recommended: false,
    subtitle: "Install Pamiac from the ChatGPT Plugin directory.",
    checklist: [
      "Create, search and edit your notes and diagrams",
      "Secure sign-in with your Pamiac account",
      "Works in ChatGPT, Codex and GPTs",
      "Public plugin. ChatGPT starts consent when it connects.",
    ],
    primaryLabel: "Install in ChatGPT",
    showOr: true,
    linkPlacement: "after-action",
    selfServe: "Let ChatGPT configure itself",
    selfServeHint: "Give this link to ChatGPT and ask it to set everything up.",
    advancedHint: "API token · Manual MCP configuration · Download skill",
  },
  {
    id: "gemini",
    name: "Gemini",
    blurb: "Connected app",
    layout: "stack",
    recommended: false,
    subtitle: "Add Pamiac as a Gemini connected app.",
    checklist: [
      "Add Pamiac as a connected app",
      "Secure sign-in with your Pamiac account",
      "Access your notes and diagrams",
      "No API key required for the connected app",
    ],
    primaryLabel: "Connect Gemini",
    showOr: true,
    linkPlacement: "after-action",
    selfServe: "Let Gemini configure itself",
    selfServeHint: "Give this link to Gemini and ask it to connect.",
    advancedHint: "API token · Manual MCP configuration · Download skill",
  },
  {
    id: "grok",
    name: "Grok",
    blurb: "Custom connector",
    layout: "stack",
    recommended: false,
    subtitle: "Add Pamiac as a custom connector.",
    checklist: [
      "Add Pamiac as a custom connector",
      "Secure sign-in with your Pamiac account",
      "Access your notes and diagrams",
      "Use an API token when OAuth is not available",
    ],
    primaryLabel: "Connect Grok",
    showOr: true,
    linkPlacement: "after-action",
    selfServe: "Let Grok configure itself",
    selfServeHint: "Give this link to Grok and ask it to connect.",
    advancedHint: "API token · Manual MCP configuration · Download skill",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    blurb: "Harness & more",
    layout: "stack",
    recommended: false,
    subtitle: "Add Pamiac in the DeepSeek harness.",
    checklist: [
      "Add Pamiac in the DeepSeek harness",
      "Secure sign-in with your Pamiac account",
      "Access your notes and diagrams",
      "Manual MCP configuration is in Advanced options",
    ],
    primaryLabel: "Connect DeepSeek",
    showOr: true,
    linkPlacement: "after-action",
    selfServe: "Let DeepSeek configure itself",
    selfServeHint: "Give this link to DeepSeek and ask it to connect.",
    advancedHint: "API token · Manual MCP configuration · Download skill",
  },
  {
    id: "other",
    name: "Other agent",
    blurb: "Any MCP client",
    layout: "stack",
    recommended: false,
    subtitle: "Use Pamiac from any MCP client.",
    checklist: [
      "Use the MCP endpoint in Advanced options",
      "Secure sign-in with your Pamiac account",
      "Access your notes and diagrams",
      "Works with any MCP client",
    ],
    primaryLabel: "Connect this agent",
    showOr: true,
    linkPlacement: "after-action",
    selfServe: "Let this agent configure itself",
    selfServeHint: "Give this link to the agent and ask it to connect.",
    advancedHint: "API token · Manual MCP configuration · Download skill",
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
