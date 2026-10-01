import { documentShareImage } from "@/components/share-preview/document-share-image";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface Properties {
  params: Promise<{ id: string }>;
}

export function GET(_request: Request, props: Properties) {
  return documentShareImage(props);
}
