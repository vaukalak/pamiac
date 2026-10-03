export const MCP_INSTRUCTIONS =
  "Pamiac stores the signed-in user's notes and UML diagrams. Search or list before creating a duplicate. Before changing a note or diagram, call read_document. update_note and update_diagram send version from that read. On conflict, re-apply onto the returned version, title, and content. Diagram updates send only changed nodes, using ids from that read. Omit position to keep layout. share_folder shares a whole folder, including nested folders and documents. Notes are markdown. Do not ask the user for a token.";

export const UPDATE_DIAGRAM_DESCRIPTION =
  "Merge changes into a diagram: call read_document in the same turn, send only changed nodes with ids from that read, omit position to keep layout. Send version from read_document. On conflict, the error includes the current version, title, and content. Re-apply onto that content and update with that version.";
