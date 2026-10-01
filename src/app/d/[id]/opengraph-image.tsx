import { NoteShareCard } from "@/components/share-preview/note-share-card";
import { ShareCard } from "@/components/share-preview/share-card";
import { shareImageResponse } from "@/components/share-preview/share-image-response";
import { loadSharePreview } from "@/lib/load-share-preview";
import {
  SHARE_APP_TITLE,
  SHARE_IMAGE_CONTENT_TYPE,
  SHARE_IMAGE_SIZE,
  shareImageAlt,
} from "@/lib/share-preview";

export const alt = SHARE_APP_TITLE;
export const size = SHARE_IMAGE_SIZE;
export const contentType = SHARE_IMAGE_CONTENT_TYPE;
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface MetadataProperties {
  params: { id: string };
}

interface Properties {
  params: Promise<{ id: string }>;
}

export async function generateImageMetadata(props: MetadataProperties) {
  const { params } = props;
  const { id } = params;
  const preview = await loadSharePreview(id);

  return [
    {
      id: "card",
      alt: shareImageAlt(preview),
      size,
      contentType,
    },
  ];
}

export default async function DocumentOpenGraphImage(props: Properties) {
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
