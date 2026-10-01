---
name: refactor
description: >-
  Merges origin/main into the current branch, then refactors only the active
  chat's existing changes to match code-quality.md. Use when the user asks to
  pull from main and refactor, restyle the current chat or branch, or invokes
  refactor (рэфактар). Does not add features, tests, or dependencies.
---

# Refactor

This skill starts the refactor agent. It does not edit the product code itself.

## Model

Use Grok 4.7 Medium reasoning. The model slug is `grok-4.7-medium`.

Do not use Cursor Fast mode. Do not select Fast in the model picker. Do not pass `fast`, `inherit`, or any model slug that ends in `-fast`. When launching this agent or any subagent in the chain, set `model` to `grok-4.7-medium`.

It follows the same writer → tester → reviewer loop as `coder`, without the
risk-analysis step and without any additions.

## Invoke

Spawn the `refactor` subagent and wait for it. Put the user task in the prompt,
and tell it to read this skill before doing anything.

If `refactor` is not an available subagent type, perform the orchestrator role
below yourself. Do not skip a role.

Do not commit or push the refactor unless the user asked. Merging `origin/main`
is the one commit this skill may create on its own. If git reports that the
branch already contains `origin/main`, there is no merge commit.

## When the refactor agent returns

- `STATUS: COMPLETED` — report the result, including `MAIN`, `HEAD`, and `PULL`.
  Stop.
- `STATUS: BLOCKED` — ask the user the `ASK` question in their language. Stop.
  Do not start iteration 6.

## Orchestrator

Do these steps in order. Do not spawn a role before the pull proof succeeds.

### 1. Pull main

Update the current branch from `origin/main` with git. Reading blobs from
`origin/main` (`git show`, `git diff` against the remote) is not a pull.

```bash
git fetch origin main
git merge origin/main --no-edit
git merge-base --is-ancestor origin/main HEAD
```

The ancestor check must exit 0. `git status` must show no unmerged paths.
Record `git rev-parse origin/main` and `git rev-parse HEAD`.

- Already contained: the merge says "Already up to date." Continue.
- Conflicts, a refused merge, or a failed ancestor check: stop with
  `STATUS: BLOCKED`. Do not refactor a stale or conflicted tree.
- Dirty files that git refuses to merge: stash them (`git stash push -u`),
  merge, then `git stash pop`. If the pop conflicts, stop with `BLOCKED`.

Do not rebase. Do not reset. Do not discard local commits.

### 2. Scope the active chat

Refactor only the changes that belong to this chat. After the merge:

```bash
git diff --name-only --diff-filter=ACMR origin/main...HEAD
git diff --name-only
git ls-files --others --exclude-standard
```

The scope is the union of those paths.

- Drop paths whose only change arrived with `origin/main`.
- If the user named a topic, keep only the paths that belong to that topic.
- If this chat already edited files, those paths stay in scope.
- If the scope is empty, stop with `STATUS: COMPLETED`. Do not scan the
  repository for violations.

Read `code-quality.md` before the first spawn. Do not write the product code
yourself while a subagent can do the role.

Never run the refactor writer, tester, and reviewer in parallel.
Maximum 5 iterations. An iteration is one pass through the three roles.
Do not spawn `risk-analysis` and do not invent tests.

Each iteration:

1. **Refactor writer** (`refactor-writer`) — restyles the scoped files to
   `code-quality.md` without adding behavior.
2. **Tester** (`tester`) — runs Prettier, TypeScript, and Jest.
3. **Reviewer** (`refactor-reviewer`) — reviews the scoped diff against
   `code-quality.md` and rejects additions.

Run the reviewer even when the tester fails, so the next pass gets both lists.

If the tester lists an `OUT_OF_SCOPE` path, stop with `STATUS: BLOCKED`. Do not
edit that file and do not start another iteration.

If the tester returns `FAIL` or the reviewer returns `CHANGES_REQUESTED`,
start the next iteration and give the refactor writer both reports. On
iteration 5, do not spawn another writer. Stop and ask the user.

If both return pass (`PASS`), stop with `STATUS: COMPLETED`.

If a subagent type is unavailable, perform that role from the contracts
below. Do not skip it.

### Spawn prompt

```text
Read .cursor/skills/refactor/SKILL.md and perform only your role.
RULES: code-quality.md
SCOPE:
- ...
TASK:
ITERATION: n of 5
TESTER:
REVIEWER:
```

Include tester and reviewer reports only after they exist.

## Role contracts

### Refactor writer

Change only files in `SCOPE`. Follow `code-quality.md`: one component per
file, render nesting, double quotes, and trailing commas.

You may extract a component into a neighboring file when the rules require the
split. The new file may contain only JSX and helpers moved from a scoped file.
You may point an existing test at a moved symbol. That is not a new test.

Do not add features, copy, props, routes, requests, fields, tests, comments,
or dependencies. Do not edit files outside the scope, including files that
fail a repo-wide check. Format only scoped files:

```bash
npx prettier --write -- <scoped files>
```

Forms (`react-hook-form`, `src/ui/Form`) and queries (`@tanstack/react-query`)
apply only when that API is already in the tree after the pull. If it is not,
leave the existing form or request as it is and record that in `NOTES`. Do not
install the package.

On later iterations, fix the tester and reviewer defects without reverting
accepted work and without expanding the scope. Do not commit.

```text
STATUS: COMPLETED | BLOCKED
PATHS:
- ...
NOTES:
- ...
```

`BLOCKED` means the scoped refactor cannot be done without an addition or a
missing dependency. Ask the orchestrator to ask the user. Do not use `BLOCKED`
for a failing test.

### Tester

Do not edit files. Run, in order:

```bash
npm run format:check
npm run typecheck
npm test
```

`PASS` only when all three exit 0. A failure in a file outside `SCOPE` is still
`FAIL`; name that path so the orchestrator can stop instead of editing it.

```text
STATUS: PASS | FAIL
FORMAT: PASS | FAIL
TYPECHECK: PASS | FAIL
JEST: PASS | FAIL
FAILURES:
- command: excerpt
OUT_OF_SCOPE:
- path
```

### Reviewer

Do not edit files. Review the current scoped diff against `code-quality.md`.
Do not repeat the tester's command output.

`PASS` only when every scoped file follows the rules and the diff adds no
behavior, test, or dependency. Request changes for an edit outside `SCOPE`, a
new feature, a new test, or a rule break. File splits required by the nesting
rule are not additions.

```text
STATUS: PASS | CHANGES_REQUESTED
DEFECTS:
- path: what to change
```

## Return

```text
STATUS: COMPLETED | BLOCKED
PULL: MERGED | ALREADY_CONTAINED
MAIN: <sha>
HEAD: <sha>
ITERATIONS: n
TESTER: PASS | FAIL
REVIEWER: PASS | CHANGES_REQUESTED
ASK:
SCOPE:
- ...
PATHS:
- ...
```

`ASK` is required when `STATUS` is `BLOCKED`: what failed on the last
iteration, and the question for the user.
