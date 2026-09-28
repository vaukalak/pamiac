# Course context: English 7 (`en-7`)

Read with [SKILL.md](SKILL.md) and [abstract.md](abstract.md). Gold lesson: `lib/lessons/unit1.ts` `u1-l1`.

## Identity

- Course id: `en-7`. Subject: Англійская мова. Grade: 7. Level: A2.
- Files: `lib/lessons/unitN.ts`, export `unitNLessons`, lesson id `uN-lN`.
- Register a new unit in `lib/course.ts` only after the reviewer accepts.
- Textbook is a topic source (Дземчанка / Юхнель, part 1). Do not copy layout or exercise wording.

## Style

- Theory is `PatternBlock`: Belarusian intro, `formula`, Belarusian `meaning`, two `{en, be}` examples, optional `watchOut`.
- Type `{ heading, body }` is gone. Do not write it.
- Dialogue is a separate `kind: "dialogue"` block, not a pattern.
- Images optional. If present: 4:3, no letters, quiet textbook scene. Paths `/media/scenes/` or `reading.image`. Lesson covers live in `lib/media.ts`; the creator does not generate covers.
- Video clips are not part of English lessons.

## Voices

| Layer                                                                     | Language                                                                                            |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| goals, intro, meaning, watchOut, explanation, reading.note                | Belarusian                                                                                          |
| title, formula, examples, vocab.en, phrases.en, reading.text, dialogue.en | English                                                                                             |
| Dialogue                                                                  | Teen to teen. An adult (`Dad`) only when the plan needs it. No lecturing teacher voice in the chat. |

## Cast (use these, do not invent a new class)

Stable pairs:

- Anya / Pavel
- Tina / Max
- Katsia / Maksim

Occasional: Olga / Dad (family). Planner picks one pair per lesson from this cast.

Do not introduce new names. Existing older lessons may have other speakers; new lessons stay on this cast.

## Units and contrasts

| unitId      | Topic      | Contrast (do not mix)                        | Recap from earlier                      |
| ----------- | ---------- | -------------------------------------------- | --------------------------------------- |
| appearance  | Знешнасць  | look / look like, used to / now              | appearance only, not character          |
| personality | Характар   | be like / look like                          | recycle look like to distinguish        |
| shopping    | Пакупкі    | Present Perfect Continuous / Present Perfect | clothes adjectives, not a new look like |
| friendship  | Сяброўства | some / any / a lot of                        | personality adjectives when they fit    |

## Creator field norms

See `lib/types.ts` `Lesson`. Minimums so `generateBank` in `lib/questions.ts` stays deterministic:

- vocab 8–10, hint > 12 chars, hint does not contain `en` or the first part of `be`
- phrases 3, distinct key words
- grammar.examples 4, at least 2 use the construction
- grammarItems 1–2, unique `answer`
- patterns: at least 2 distinct `meaning`s
- reading: sentences longer than 28 chars, vocab words inside
- each theory / grammar / reading block should have `check` (4 options, one answer)

`generateBank` fills 100 then pads with vocab translation. A test shows 10: 2 drag, 2 trueFalse, 2 multi, 4 single. Nobody writes those 100 by hand.

## Bans

- `be like` in Appearance
- A wall of English prose instead of formulas
- Reading that introduces a formula not in this lesson’s theory
- Questions about UI, block numbers, or “the vocab of this lesson”
