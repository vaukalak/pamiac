import { PAMIAC_MCP_URL, PAMIAC_SKILL_URL } from "@/lib/connect-platforms";
import { Paragraph } from "@/ui/Paragraph";

export function ConnectAgentInstructions() {
  return (
    <article className="connect-agent-instructions">
      <h2>Connect to Pamiac</h2>
      <Paragraph>{`Pamiac MCP server: ${PAMIAC_MCP_URL}`}</Paragraph>
      <Paragraph>
        Preferred setup: add the MCP endpoint, prefer OAuth, open the authorization page when
        required, never ask the user to paste a password or OAuth access token, then call
        list_workspaces.
      </Paragraph>
      <Paragraph>
        If OAuth is unavailable: use a Pamiac API token stored as PAMIAC_TOKEN and never print the
        token.
      </Paragraph>
      <Paragraph>{`If MCP is unavailable: use ${PAMIAC_SKILL_URL}`}</Paragraph>
    </article>
  );
}
