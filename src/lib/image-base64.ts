import { HttpError } from "./http.ts";

const IMAGE_BASE64_ERROR = "Image data is not valid base64.";

export function decodeImageBase64(data: string) {
  if (/^\s*data:/i.test(data)) throw new HttpError(400, IMAGE_BASE64_ERROR);
  const compact = data.replace(/\s+/g, "");
  if (
    compact.length === 0 ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(compact)
  ) {
    throw new HttpError(400, IMAGE_BASE64_ERROR);
  }
  return new Uint8Array(Buffer.from(compact, "base64"));
}
