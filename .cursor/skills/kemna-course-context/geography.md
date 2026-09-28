# Course context: Geography 7 (`geo-7`)

Read with [SKILL.md](SKILL.md) and [abstract.md](abstract.md).
Sources: `lib/geography/sources.ts`. Files: `lib/geography/lessons/unitN.ts`.

Curriculum text lives on Notion
(`https://tricky-poppyseed-8c9.notion.site/7-5c3b117060774778978dd263fefd5945`).
Videos: playlist `PLdhNbmDNB8aCwXsUtv4HyeOfp5o3_QhsJ` (Геаграфія з Маляванычам).

## Identity

- Course id: `geo-7`. Subject: Геаграфія. Grade: 7.
- `subjectId: "geography"`, `register: "terms"`.
- Lesson id from `geographySources` (`geo-uN-lN`). Do not invent ids.
- Register a new lesson in `lib/geography/lessons/unitN.ts` only. Units already exist in `lib/geography/course.ts`.
- Notion is a topic source. Rewrite. Do not copy layout, callouts, or exercise wording.
- Skip the Notion folder `СТАРОЕ`.

## Video clips (required)

Every geography lesson uses **fragments** of **that lesson’s** YouTube video, placed **inside** the theory block they illustrate.

1. Look up the row in `lib/geography/sources.ts`. `youtube.videoId` must equal `source.videoId`.
2. If `videoId` is `null`, stop with `BLOCKED` (playlist has no video yet). Do not borrow another lesson’s video.
3. Put a `video: { videoId, start, end, caption }` on **each** `PatternBlock`. Use the YouTube description chapter that matches the block (e.g. `13:40 Платформы і пліты`).
4. Each clip: `start`/`end` in seconds; length **20–90** seconds; `caption` in Belarusian names the chapter and says what to notice, not a transcript.
5. `geo-u1-l1` starts with a standalone `kind: "video"` intro from the first video’s `00:00 Знаёмства` chapter. Later lessons do not need a separate intro block.
6. Never embed the whole video. Never use a clip from a different paragraph.

How to pick times: read the chapter list in the YouTube description (`00:00 …`, `01:05 …`). Convert `mm:ss` to seconds; end the clip at the next chapter or at +90s, whichever is sooner.

```ts
{
  heading: "Платформы",
  intro: "…",
  video: {
    videoId: "9Dr2lAYcIHg",
    start: 820,
    end: 910,
    caption: "Таймкод «Платформы і пліты»: шукай двух’ярусную будову.",
  },
  patterns: [/* … */],
}
```

## Style

- Theory is `PatternBlock`: Belarusian intro, `formula` (term or short rule), Belarusian `meaning`, two `{en, be}` examples where `en` is the Belarusian term/sentence and `be` is a short gloss or why.
- Dialogue is optional. Prefer video as the lived example.
- `vocab.en` = term; `vocab.be` = short meaning; hint > 12 chars and does not contain the term.
- `phrases`: 3 ready facts (`en` = fact, `be` = why / detail).
- Reading: original Belarusian, 4–7 sentences, terms from `vocab.en` appear inside.
- Grammar slot: the contrast rule (not English grammar). Title names the contrast.

## Voices

Everything student-facing is Belarusian. Do not add English TTS. Do not invent a teen dialogue cast.

## Units and contrasts

| unitId       | Topic                 | Contrast (do not mix)                                                | Recap from earlier                   |
| ------------ | --------------------- | -------------------------------------------------------------------- | ------------------------------------ |
| envelope     | Геаграфічная абалонка | абалонка Зямлі / геаграфічная абалонка                               | —                                    |
| earth-nature | Прырода мацерыкоў     | платформа / складкаваты пояс; цыклон / антыцыклон; надвор’е / клімат | envelope terms                       |
| oceans       | Акіяны                | акіян / мора; цячэнне / мусон                                        | relief and climate belts             |
| africa       | Афрыка                | геаграфічнае становішча / рэльеф; клімат / унутраныя воды            | plates, belts                        |
| australia    | Аўстралія і Акіянія   | мацярык / акіянія                                                    | africa comparison only when it helps |

Planner picks **one** contrast. Do not teach a whole theme in one lesson.

## Creator field norms

See `lib/types.ts` `Lesson`. Minimums so `generateBank` stays deterministic:

- `subjectId: "geography"`, `register: "terms"`
- `youtube: { videoId, title }` from the source row
- vocab 8–10
- phrases 3
- grammar.examples 4, at least 2 use the contrast
- grammarItems 1–2, unique `answer`
- patterns: at least 2 distinct `meaning`s
- each `PatternBlock` has `video` with the same `videoId` as `youtube.videoId`
- `geo-u1-l1` also has a leading `kind: "video"` intro (`0–65`)
- reading: sentences longer than 28 chars, vocab terms inside

## Bans

- Whole-video embed
- Video from a different lesson
- Copied Notion paragraphs
- English as the object of study
- Questions about UI or “the vocab of this lesson”
- Using `СТАРОЕ` Notion pages
