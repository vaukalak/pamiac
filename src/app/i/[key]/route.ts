import { errorResponse } from "@/lib/http";
import { getR2Object, readR2Config } from "@/lib/r2";
import { imageObjectContentType } from "@/lib/stored-image-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Properties {
  params: Promise<{ key: string }>;
}

export async function GET(_request: Request, props: Properties) {
  const { key } = await props.params;
  const contentType = imageObjectContentType(key);
  if (!contentType) return new Response(null, { status: 404 });
  try {
    const object = await getR2Object(readR2Config(), { key });
    if (!object) return new Response(null, { status: 404 });
    return new Response(object.bytes, {
      headers: {
        "cache-control": "public, max-age=31536000, immutable",
        "content-type": contentType,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
