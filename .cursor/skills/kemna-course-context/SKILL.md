---
name: kemna-course-context
description: >-
  Loads the Kemna course context every lesson-authoring agent must receive:
  style, characters or terms, voices, unit memory, video sources, and bans.
  Use when planning, creating, correcting, or reviewing a Kemna lesson, or
  when a spawn prompt needs a course-context link.
disable-model-invocation: true
---

# Kemna course context

Use Grok 4.7 Medium reasoning (`grok-4.7-medium`). Do not use Cursor Fast mode or any model slug that ends in `-fast`.

Required input for planner, creator, corrector, and reviewer. Not a pipeline
step. If this file was not attached to the prompt, stop and ask the orchestrator
to pass the link.

## Always do

1. Read the subject file for this course:
   - English 7: [english.md](english.md)
   - Geography 7: [geography.md](geography.md)
   - Any subject: [abstract.md](abstract.md)
2. Read neighboring lessons in the same unit. English also: `lib/course.ts`.
3. Treat characters, voices, video mapping, and bans as constraints, not inspiration.

## Pass as a link

Orchestrator spawn prompts must include:

```text
COURSE_CONTEXT:
- .cursor/skills/kemna-course-context/SKILL.md
- .cursor/skills/kemna-course-context/abstract.md
- .cursor/skills/kemna-course-context/<subject>.md
```

Do not paste the whole textbook or every lesson into the prompt. The link plus
the unit id and previous lesson ids is enough.

## Additional resources

- Slot contract: [abstract.md](abstract.md)
- English 7 voice, cast, units: [english.md](english.md)
- Geography 7 sources and video clips: [geography.md](geography.md)
- Fetch a Notion lesson: `python3 scripts/fetch-notion.py <notionId>`
