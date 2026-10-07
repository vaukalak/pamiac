import type { MetadataRoute } from "next";
import { robotsPolicy } from "@/lib/robots-policy";

export default function robots(): MetadataRoute.Robots {
  return robotsPolicy();
}
