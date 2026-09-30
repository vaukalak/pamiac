import { ShareCard } from "@/components/share-preview/share-card";
import { shareImageResponse } from "@/components/share-preview/share-image-response";
import { SHARE_APP_TITLE, SHARE_IMAGE_CONTENT_TYPE, SHARE_IMAGE_SIZE } from "@/lib/share-preview";

export const alt = SHARE_APP_TITLE;
export const size = SHARE_IMAGE_SIZE;
export const contentType = SHARE_IMAGE_CONTENT_TYPE;
export const runtime = "nodejs";

export default function OpenGraphImage() {
  return shareImageResponse(<ShareCard />);
}
