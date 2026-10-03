export const MCP_INSTRUCTIONS =
  "Pamiac stores the signed-in user's notes and UML diagrams. Search or list before creating a duplicate. Call read_document before changing a note or diagram. update_note and update_diagram send version from that read. On conflict, re-apply onto that version, title, and content. Send only changed diagram nodes and their ids, and omit position. Notes are markdown. list_folders, create_folder, move_document_to_folder, and move_folder place notes and diagrams in folders. Do not ask the user for a token.";

export const UPDATE_DIAGRAM_DESCRIPTION =
  "Merge changes into a diagram: call read_document in the same turn, send only changed nodes with ids from that read, omit position to keep layout. Send version from read_document. On conflict, the error includes the current version, title, and content. Re-apply onto that content and update with that version.";
