import { NoteShareCard } from "@/components/share-preview/note-share-card";
import { ShareCard } from "@/components/share-preview/share-card";
import { shareImageResponse } from "@/components/share-preview/share-image-response";
import { loadSharePreview } from "@/lib/load-share-preview";

interface Properties {
  params: Promise<{ id: string }>;
}

export async function documentShareImage(props: Properties) {
  const { params } = props;
  const { id } = await params;
  const preview = await loadSharePreview(id);
  const card = preview.publicNote ? (
    <NoteShareCard lines={preview.lines} title={preview.title} />
  ) : (
    <ShareCard />
  );

  return shareImageResponse(card);
}
