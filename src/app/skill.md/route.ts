import { publishedSkillMarkdown } from "@/lib/skill-markdown";

export function GET() {
  return new Response(publishedSkillMarkdown(), {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
    },
  });
}
