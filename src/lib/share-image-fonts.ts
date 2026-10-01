import { readFile } from "node:fs/promises";

const regularFont = new URL("../../assets/Outfit-Regular.ttf", import.meta.url);
const semiboldFont = new URL("../../assets/Outfit-SemiBold.ttf", import.meta.url);

export async function shareImageFonts() {
  const [regular, semibold] = await Promise.all([readFile(regularFont), readFile(semiboldFont)]);

  return [
    { name: "Outfit", data: regular, style: "normal" as const, weight: 400 as const },
    { name: "Outfit", data: semibold, style: "normal" as const, weight: 600 as const },
  ];
}
