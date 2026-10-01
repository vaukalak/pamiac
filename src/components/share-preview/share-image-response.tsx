import { ImageResponse } from "next/og";
import type { ReactElement } from "react";
import { shareImageFonts } from "@/lib/share-image-fonts";
import { SHARE_IMAGE_CONTENT_TYPE, SHARE_IMAGE_SIZE } from "@/lib/share-preview";

export async function shareImageResponse(element: ReactElement) {
  const image = new ImageResponse(element, {
    width: SHARE_IMAGE_SIZE.width,
    height: SHARE_IMAGE_SIZE.height,
    fonts: await shareImageFonts(),
  });
  const headers = new Headers(image.headers);
  headers.set("Content-Type", SHARE_IMAGE_CONTENT_TYPE);
  headers.set("Content-Disposition", 'inline; filename="share-card.png"');
  return new Response(image.body, { status: image.status, headers });
}
