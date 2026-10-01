import { readFile } from "node:fs/promises";

const regularFont = new URL("../../assets/Fraunces-Regular.ttf", import.meta.url);
const semiboldFont = new URL("../../assets/Fraunces-SemiBold.ttf", import.meta.url);

export async function shareImageFonts() {
  const [regular, semibold] = await Promise.all([readFile(regularFont), readFile(semiboldFont)]);

  return [
    { name: "Fraunces", data: regular, style: "normal" as const, weight: 400 as const },
    { name: "Fraunces", data: semibold, style: "normal" as const, weight: 600 as const },
  ];
}
