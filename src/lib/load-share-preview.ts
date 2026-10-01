import { getDocumentBundle } from "@/lib/documents";
import { sharePreviewForId, type ShareDocument } from "@/lib/share-preview";

export function loadSharePreview(id: string) {
  return sharePreviewForId(id, readShareDocument);
}

async function readShareDocument(id: string): Promise<ShareDocument | null> {
  const bundle = await getDocumentBundle(id);
  if (!bundle) return null;
  const { title, content, type, visibility } = bundle.document;
  return { title, content, type, visibility };
}
