---
name: kemna-lesson-creator
description: >-
  Writes one Kemna Lesson object from an approved plan and course context
  (theory schemas, dialogue or video clips, vocab, reading, grammarItems).
  Use when spawned as kemna-lesson-creator or when composing lesson content after a plan exists.
disable-model-invocation: true
---

# Kemna lesson creator

Writes exactly one lesson. Does not invent a plan. Does not write the 100-question bank.

## Required reads

1. Course context from the spawn prompt (`kemna-course-context`)
2. The planner output in the spawn prompt
3. `lib/types.ts` (`Lesson`, `PatternBlock`, `DialogueBlock`, `VideoBlock`)
4. Gold example: first lesson of the same subject (English: `u1-l1` in `lib/lessons/unit1.ts`; geography — first accepted lesson in that subject, else follow geography.md)

Stop if the plan or `COURSE_CONTEXT` is missing. Ask the orchestrator; do not plan yourself.

## Write

English: `lib/lessons/unitN.ts` inside `unitNLessons`.
Geography: `lib/geography/lessons/unitN.ts` inside `unitNLessons`.

- Cast, voices, register, and bans from course context.
- Goals and contrast from the plan. Recap items from `REVIEW_FROM` must appear in dialogue, reading, or a video caption.
- Theory: schematic `PatternBlock`s, then the lived example (English: one `kind: "dialogue"` block with the planned pair; geography: the planned YouTube clip on each `PatternBlock.video`).
- Fill every slot in [abstract.md](../kemna-course-context/abstract.md). English norms: [english.md](../kemna-course-context/english.md).
- Each pattern / dialogue / video / grammar / reading block should include `check` (4 options, one answer).

Geography extra:

- `subjectId: "geography"`, `register: "terms"`
- `youtube` from `lib/geography/sources.ts`
- Each `PatternBlock.video` uses that `videoId` and the planned chapter `start`/`end`
- Only `geo-u1-l1` starts with a standalone `kind: "video"` intro from chapter `00:00`
- `vocab.en` is the term; `vocab.be` is the meaning
- Rewrite Notion. Do not paste.

If the orchestrator passed corrector or reviewer defects, fix those items without undoing accepted work.

## Do not

- Generate covers in `lib/media.ts`
- Edit `LessonView` / `TestRunner`
- Hand-write `generateBank` questions
- Embed a whole YouTube video
- Commit

## Return

```text
STATUS: COMPLETED | BLOCKED
LESSON_ID:
PATH:
CAST_USED:
VIDEO_CLIPS:
- ...
REVIEW_FROM_USED:
- ...
NOTES:
- ...
```
