export const MCP_INSTRUCTIONS =
  "Pamiac stores the signed-in user's notes and UML diagrams. Search or list before creating a duplicate. Before changing a diagram, call read_document and then update_diagram with only the nodes you change, using ids from that read. Omit position to keep layout. Notes are markdown. Do not ask the user for a token.";

export const UPDATE_DIAGRAM_DESCRIPTION =
  "Merge changes into a diagram: call read_document in the same turn, send only changed nodes with ids from that read, omit position to keep layout.";
