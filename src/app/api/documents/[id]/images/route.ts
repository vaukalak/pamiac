import { uploadNoteImage } from "@/lib/note-image";
import { IMAGE_CAP_ERROR, imageRequestTooLarge } from "@/lib/image-upload";
import { errorResponse, HttpError, json } from "@/lib/http";

type Context = { params: Promise<{ id: string }> };

async function imageFile(request: Request) {
  if (imageRequestTooLarge(request.headers.get("content-length"))) {
    throw new HttpError(413, IMAGE_CAP_ERROR);
  }
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) throw new HttpError(400, "Choose an image file.");
  return { bytes: new Uint8Array(await file.arrayBuffer()), type: file.type };
}

export async function POST(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const file = await imageFile(request);
    const uploaded = await uploadNoteImage(id, file);
    return json({ url: uploaded.url });
  } catch (error) {
    return errorResponse(error);
  }
}
