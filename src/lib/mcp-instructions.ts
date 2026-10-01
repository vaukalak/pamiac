export const MCP_INSTRUCTIONS =
  "Pamiac stores the signed-in user's notes and UML diagrams. Search or list before creating a duplicate. Before changing a note or diagram, call read_document. update_note and update_diagram send version from that read. On conflict, read again, re-apply, and update with the new version. Diagram updates send only the nodes you change, using ids from that read. Omit position to keep layout. Notes are markdown. Do not ask the user for a token.";

export const UPDATE_DIAGRAM_DESCRIPTION =
  "Merge changes into a diagram: call read_document in the same turn, send only changed nodes with ids from that read, omit position to keep layout. Send version from read_document. On conflict, read again, re-apply, and update with the new version.";
