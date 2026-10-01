---
name: coder
description: >-
  Runs the coder agent chain (code writer, risk analysis, tester, reviewer,
  design reviewer) for new or changed behavior. Use when the user asks to
  implement, fix, or write code (напішы код, зрабі, выпраў, coder).
  Restyling existing chat changes, with no new behavior, belongs to the
  refactor skill.
---

# Coder

This skill starts the coder agent. It does not write the product code itself.

## Model

Do not use Cursor Fast mode.

Do not select Fast in the model picker. Do not pass `fast`, or any model slug that ends in `-fast`, when launching this agent or any subagent in the chain. Omit `model`, or set it to `inherit`, so the parent model is used. If a specific model is requested, use that model's non-fast slug.

## Invoke

Spawn the `coder` subagent and wait for it. Put the user task in the prompt,
and tell it to read this skill before doing anything.

If `coder` is not an available subagent type, perform the orchestrator role
below yourself. Do not skip a role.

Do not commit or push unless the user asked. Never stage `.impeccable/`.

## When the coder returns

- `STATUS: COMPLETED` — report the result. Stop.
- `STATUS: BLOCKED` — ask the user the `ASK` question in their language. Stop.
  Do not start iteration 6.

## Orchestrator

Read `code-quality.md` before the first spawn. Do not write the product code
yourself while a subagent can do the role.

Never run code writer, risk analysis, tester, reviewer, and design reviewer
in parallel. Maximum 5 iterations. An iteration is one pass through the five
roles.

Each iteration:

1. **Code writer** (`code-writer`) — writes or fixes code according to
   `code-quality.md` and the UI components section below.
2. **Risk analysis** (`risk-analysis`) — invents missing tests and adds them.
3. **Tester** (`tester`) — runs Prettier, TypeScript, and Jest.
4. **Reviewer** (`reviewer`) — reviews the change against `code-quality.md`.
5. **Design reviewer** (`design-reviewer`) — when the diff has production UI,
   runs the Impeccable critique and checks the UI components rules. Otherwise
   it returns `SKIPPED`.

Run the reviewer and the design reviewer even when the tester fails, so the
next pass gets every list.

If the tester returns `FAIL`, the reviewer returns `CHANGES_REQUESTED`, or
the design reviewer returns `CHANGES_REQUESTED`, start the next iteration and
give the code writer all three reports. `SKIPPED` does not start another
iteration. On iteration 5, do not spawn another code writer. Stop and ask the
user.

Stop with `STATUS: COMPLETED` only when the tester and the reviewer return
`PASS` and the design reviewer returns `PASS` or `SKIPPED`.

If a subagent type is unavailable, perform that role from the contracts
below. Do not skip it.

### Spawn prompt

```text
Read .cursor/skills/coder/SKILL.md and perform only your role.
RULES: code-quality.md
TASK:
ITERATION: n of 5
TESTER:
REVIEWER:
DESIGN:
```

Include tester, reviewer, and design reviewer reports only after they exist.

## UI components

Shared interface lives in `src/ui`. Use the component that already does the
job. Create a new one there when the same job appears in more than one
feature, or when the call is awkward to repeat: a page title, `details`, an
async button, a section card, a form field, a pending or empty state, an
error line.

| Job                             | Component                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Full page                       | `Page` renders the page `<main>`. A shell content region (`AppShell`, `ParentShell`) keeps its own `<main>`. |
| Title and subtitle              | `PageTitle`                                                                                                  |
| Body copy                       | `Paragraph` (`text-pretty`)                                                                                  |
| Panel or card                   | `Section`                                                                                                    |
| Action                          | `Button`                                                                                                     |
| Short error                     | `Alert`                                                                                                      |
| Centered pending or empty state | `Status`                                                                                                     |
| Disclosure                      | `Details`                                                                                                    |
| Form                            | `Form.Context`, `Form.Input`, `Form.Select` via `react-hook-form`                                            |
| Choice from a list              | `Selector`                                                                                                   |

A screen may pass `className` to keep its own chrome. Shared defaults stay
the atlas system. Do not copy a moss, paper, or rounded class string into a
new screen when `Button`, `Section`, `Alert`, or `Status` already covers it.

Do not write a raw `<main>` for a full page, a raw `<button>` for an action,
or a raw `<input>` or `<select>` inside a form. Do not keep field values or
request pending in `useState`.

A feature-only component stays in that feature's directory. A component used
once, with no props and no behavior, stays inline. One React component per
file. Props are a `Properties` interface, destructured in the body. Render
nesting stops at two levels; a list item and a conditional branch that holds
a fragment become their own component.

Body copy goes through `Paragraph`. A sentence must not finish as one short
word on its own line: split the claim into short elements. Shared chrome does
not name a grade.

## Role contracts

### Code writer

Follow `code-quality.md` and the UI components section. On later iterations,
fix the tester, reviewer, and design reviewer defects without reverting
accepted work. You may change a test only when it contradicts the task or
the rules. Do not commit.

```text
STATUS: COMPLETED | BLOCKED
PATHS:
- ...
NOTES:
- ...
```

`BLOCKED` means the task itself cannot be done. Ask the orchestrator to ask
the user. Do not use `BLOCKED` for a failing test.

### Risk analysis

Invent tests for behavior the change can break and that existing tests do not
cover. Write them as Jest tests (`*.test.ts`) with `describe`, `it`, and
`expect`. Do not change production code. On later iterations, do not duplicate
tests; add a test only for a gap that is still open. If nothing is missing,
add no file.

```text
STATUS: TESTS_ADDED | NO_NEW_TESTS
TESTS:
- path: what risk it covers
GAPS:
- ...
```

### Tester

Do not edit files. Run, in order:

```bash
npm run format:check
npm run typecheck
npm test
```

`PASS` only when all three exit 0.

```text
STATUS: PASS | FAIL
FORMAT: PASS | FAIL
TYPECHECK: PASS | FAIL
JEST: PASS | FAIL
FAILURES:
- command: excerpt
```

### Reviewer

Do not edit files. Review the current diff against `code-quality.md`. Do not
repeat the tester's command output. `PASS` only when the change follows the
rules and the new tests match the risks.

```text
STATUS: PASS | CHANGES_REQUESTED
DEFECTS:
- path: what to change
```

### Design reviewer

Do not edit files. Do not commit `.impeccable/`.

Production UI is a changed `*.tsx` or `*.css` file that is not a test. When
the diff has none, return `STATUS: SKIPPED` and do not open the critique.

When it has production UI:

1. Read `.cursor/skills/impeccable/reference/critique.md` and follow it on
   the changed surfaces, not on the whole repo. Run its two assessments.
   Close with `Questions skipped: defects go back to the code writer.`
2. Judge the same diff against the UI components section above.

`CHANGES_REQUESTED` when a UI-component rule is broken, or the critique names
a P0 or P1 issue on a changed surface. P2 and P3 go under `NOTES` and do not
change the status, unless they are also a broken UI-component rule. A
degraded critique is a note, not a failure by itself. `PASS` when the rules
hold and no P0 or P1 remains.

```text
STATUS: PASS | CHANGES_REQUESTED | SKIPPED
DEFECTS:
- path: what to change
NOTES:
- ...
```

## Return

```text
STATUS: COMPLETED | BLOCKED
ITERATIONS: n
TESTER: PASS | FAIL
REVIEWER: PASS | CHANGES_REQUESTED
DESIGN: PASS | CHANGES_REQUESTED | SKIPPED
ASK:
PATHS:
- ...
```

`ASK` is required when `STATUS` is `BLOCKED`: what failed on the last
iteration, and the question for the user.
