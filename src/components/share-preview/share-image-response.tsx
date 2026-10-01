import { ImageResponse } from "next/og";
import type { ReactElement } from "react";
import { shareImageFonts } from "@/lib/share-image-fonts";
import { SHARE_IMAGE_SIZE } from "@/lib/share-preview";

export async function shareImageResponse(element: ReactElement) {
  return new ImageResponse(element, {
    width: SHARE_IMAGE_SIZE.width,
    height: SHARE_IMAGE_SIZE.height,
    fonts: await shareImageFonts(),
  });
}
