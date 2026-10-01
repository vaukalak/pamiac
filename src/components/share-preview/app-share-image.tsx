import { ShareCard } from "@/components/share-preview/share-card";
import { shareImageResponse } from "@/components/share-preview/share-image-response";

export function appShareImage() {
  return shareImageResponse(<ShareCard />);
}
