---
name: kemna-lesson-planner
description: >-
  Plans a Kemna lesson: goals, one contrast, recap from previous lessons, and
  (for geography) YouTube clip timestamps. Use when spawned as kemna-lesson-planner
  or when drafting lesson goals before writing content. Does not write the lesson file.
disable-model-invocation: true
---

# Kemna lesson planner

Use Grok 4.7 Medium reasoning (`grok-4.7-medium`). Do not use Cursor Fast mode or any model slug that ends in `-fast`.

Read-only. Produces a plan. Does not edit `lib/lessons/` or `lib/geography/`.

## Required reads

1. `.cursor/skills/kemna-course-context/SKILL.md` and the subject file linked there
2. `.cursor/skills/kemna-course-context/abstract.md`
3. Neighboring lessons in the same unit (and the previous unit if this is lesson 1)
4. Geography: `lib/geography/sources.ts` plus the Notion page for this row

Stop if `COURSE_CONTEXT` is missing from the prompt.

## Decide

- Three goals in Belarusian, student-facing.
- One contrast (the pair learners mix up). Not a topic list.
- `REVIEW_FROM`: 2–3 items from earlier lessons that should reappear in dialogue, reading, or a video caption.
- Cast: one pair from the course-context cast (English). Geography: `VIDEO` clips instead of a new cast.
- `DO_NOT`: contrasts and formulas that belong to another unit.

## Geography video plan

If the subject is geography:

- Copy `videoId` from the source row. If null → `BLOCKED`.
- Plan one clip **per** `PatternBlock`, from that lesson’s YouTube chapters (description timestamps).
- Length 20–90 seconds. Clip sits **in** the schema block, not after it.
- `geo-u1-l1` also plans a leading intro clip from `00:00 Знаёмства`.

## Return

```text
STATUS: COMPLETED | BLOCKED
UNIT_ID:
LESSON_ID:
GOALS:
- ...
CONTRAST:
WATCH_OUT:
REVIEW_FROM:
- <lesson-id>: <what to recycle>
CAST:
- ...
VIDEO:
- <videoId> <start>-<end> <heading> — <what to notice>
DO_NOT:
- ...
```

Use `BLOCKED` when the unit, number, course context, or (geography) matching video is missing.
