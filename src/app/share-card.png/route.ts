import { appShareImage } from "@/components/share-preview/app-share-image";

export const runtime = "nodejs";

export function GET() {
  return appShareImage();
}
