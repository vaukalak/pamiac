import type { Metadata } from "next";

export const privatePageRobots = {
  index: false,
  follow: false,
} satisfies NonNullable<Metadata["robots"]>;
