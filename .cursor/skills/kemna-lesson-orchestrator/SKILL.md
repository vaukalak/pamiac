---
name: kemna-lesson-orchestrator
description: >-
  Orchestrates Kemna lesson authoring by spawning planner, creator, corrector,
  and reviewer agents and attaching course context to every spawn. Use when
  the user asks to create, add, rewrite, or plan a Kemna lesson or unit lesson
  (урок, урок англійскай, урок геаграфіі, курс геаграфіі, lesson author).
---

# Kemna lesson orchestrator

This agent does not write lesson content. It creates four agents in order and
puts a course-context link in every spawn.

## Model

Use Grok 4.7 Medium reasoning. The model slug is `grok-4.7-medium`.

Do not use Cursor Fast mode. Do not select Fast in the model picker. Do not pass `fast`, `inherit`, or any model slug that ends in `-fast`. When launching this agent or any subagent, set `model` to `grok-4.7-medium`.

## Before any spawn

Read:

1. `.cursor/skills/kemna-course-context/SKILL.md`
2. `.cursor/skills/kemna-course-context/abstract.md`
3. Subject file (English: `.cursor/skills/kemna-course-context/english.md`;
   Geography: `.cursor/skills/kemna-course-context/geography.md`)
4. `lib/types.ts` and neighboring lessons in the unit
5. English: `lib/course.ts`. Geography: `lib/geography/sources.ts` and the Notion page

If the subject is missing, default to English 7. If the request mentions
Notion/YouTube geography sources, use Geography 7.

## Spawn order

Never run planner, creator, corrector, and reviewer in parallel.

1. **Planner** (`kemna-lesson-planner`) — goals, contrast, recap, cast or video clips.
2. **Creator** (`kemna-lesson-creator`) — writes the `Lesson` object.
3. **Corrector** (`kemna-lesson-corrector`) — relevance, determinism, sequence, video.
4. **Reviewer** (`kemna-lesson-reviewer`) — hi-level accept / revise.

If `Task` cannot use that `subagent_type`, perform the role yourself by reading
its SKILL.md. Do not skip the role.

## Every spawn prompt must contain

```text
COURSE_CONTEXT:
- .cursor/skills/kemna-course-context/SKILL.md
- .cursor/skills/kemna-course-context/abstract.md
- .cursor/skills/kemna-course-context/<subject>.md

Read that skill before doing any work.
Subject, unitId, lesson number/id:
Plan (after planner exists):
Lesson path (after creator exists):
```

Geography extra:

```text
SOURCE:
- lib/geography/sources.ts row for this lessonId
- Notion page (fetch via scripts/fetch-notion.py)
- YouTube videoId from that row only
```

## Loops

- Corrector `CHANGES_REQUESTED` → resume creator with the defect list. Max 2 rounds.
- Reviewer `REVISE_CREATOR` → resume creator. Max 1 extra round.
- Reviewer `REVISE_PLAN` → resume planner, then creator again. Max 1 extra plan.
- Then stop and report what is still red.

## After accept

- Run `npx tsc --noEmit` if the creator wrote TypeScript.
- Do not write `generateBank` questions by hand.
- Do not commit unless the user asked.
- Geography: after the first accepted lesson, set `geography.available` to true
  in `lib/subjects.ts` and show it in `SubjectGallery`.

## Skills for spawned roles

- [../kemna-lesson-planner/SKILL.md](../kemna-lesson-planner/SKILL.md)
- [../kemna-lesson-creator/SKILL.md](../kemna-lesson-creator/SKILL.md)
- [../kemna-lesson-corrector/SKILL.md](../kemna-lesson-corrector/SKILL.md)
- [../kemna-lesson-reviewer/SKILL.md](../kemna-lesson-reviewer/SKILL.md)
