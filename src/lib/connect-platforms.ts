export const PAMIAC_MCP_URL = "https://pamiac.com/api/mcp";

export const CURSOR_MCP_URL = PAMIAC_MCP_URL;

export const AGENT_CONNECT_URL = "https://pamiac.com/connect/agent";

export const PAMIAC_AGENT_ONBOARDING_URL = AGENT_CONNECT_URL;

export const AGENT_CONNECT_LABEL = "pamiac.com/connect/agent";

export const PAMIAC_SKILL_URL = "https://pamiac.com/skill.md";

export const AGENT_SETUP_PROMPT = `Connect yourself to Pamiac using these instructions: ${AGENT_CONNECT_URL}`;

export const PAMIAC_AGENT_SETUP_PROMPT = AGENT_SETUP_PROMPT;

export const CLAUDE_CODE_INSTALL_COMMAND = `claude mcp add --transport http pamiac ${PAMIAC_MCP_URL}`;

export const CHATGPT_DIRECTORY_STATUS = "pending" as "pending" | "published";

export const COPY_SETUP_PROMPT_LABEL = "Copy setup prompt";

export const CONNECT_PLATFORMS = [
  {
    id: "cursor",
    name: "Cursor",
    blurb: "One click",
    layout: "stack",
    recommended: false,
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
      "Secure sign-in with your Pamiac account",
      "Access your notes and diagrams",
      "No API key required",
    ],
    primaryLabel: "Copy setup prompt",
    showOr: false,
    linkPlacement: "before-action",
    selfServe: "Let Claude configure itself",
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    blurb: "ChatGPT connection",
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
    id: "gemini",
    name: "Gemini Spark",
    blurb: "Connected app",
    layout: "stack",
    recommended: false,
    lead: "",
    subtitle: "Add Pamiac as a Gemini Spark connected app.",
    checklist: [
      "Secure sign-in with your Pamiac account",
      "Access your notes and diagrams",
      "No API key required for the connected app",
    ],
    primaryLabel: "Copy setup prompt",
    showOr: true,
    linkPlacement: "after-action",
    selfServe: "Let Gemini Spark configure itself",
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
  ["x.ai", "grok"],
  ["grok.com", "grok"],
];

export function connectPlatform(id: ConnectPlatformId): ConnectPlatform {
  const platform = CONNECT_PLATFORMS.find((item) => item.id === id);
  if (!platform) return CONNECT_PLATFORMS[0];
  return platform;
}

const CONNECT_TOKEN_NAMES: Record<ConnectPlatformId, string> = {
  cursor: "Cursor on this computer",
  claude: "Claude on work laptop",
  chatgpt: "ChatGPT on this computer",
  gemini: "Gemini Spark on this computer",
  grok: "Grok on this computer",
  other: "Custom coding agent",
};

export function connectTokenName(id: ConnectPlatformId) {
  return CONNECT_TOKEN_NAMES[id];
}

export function cursorInstallUrl() {
  const config = btoa(JSON.stringify({ url: PAMIAC_MCP_URL }));
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
