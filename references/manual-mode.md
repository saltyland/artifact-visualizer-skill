# Manual mode: the world's easiest manual from a README

Goal: a reader who has never seen the project gets **one real success within five minutes** and knows where to look next, without reading a single paragraph twice.

A README is written for the author's memory. A manual is written for a stranger's first five minutes. Don't transcribe the README. Rebuild it around what the reader does.

## 1. Gather the facts (never invent them)

Read, in this order, and note where each fact came from:

1. README and `docs/`.
2. The real interface: `--help` output, CLI argument parser, exported functions, routes, on-screen labels, config schema and defaults, `package.json` / `pyproject.toml` / `Makefile` scripts, `.env.example`.
3. Examples and tests: `examples/`, E2E specs, fixtures. They show the real happy path and real outputs.
4. Issues or FAQ, if present, for where people get stuck.

Write a fact sheet in the scratchpad: install steps per OS, the first command, what it outputs, where results go, how to undo, required config, common errors. Every command, flag, label, and default on the page must trace to a line in the source.

- When the README and the code disagree, the code wins. Add a one-line note on the page only if the reader would hit the difference.
- If a step can be run safely (an install into a temp folder, a `--help`, a dry run), run it in the scratchpad to get the real output. Otherwise show the output as 「出力例」 and say so.
- Never run anything that writes outside the scratchpad, sends data, or needs real credentials.

## 2. Find the first success

Pick the one shortest path from zero to a visible result: install → one command (or one click) → a result the reader can see. That path becomes the stage.

- Prefer the default settings. No flags beyond what the first success needs.
- If setup has an unavoidable step (an API key, a DB), keep it on the path but show it as its own frame with a placeholder like `YOUR_API_KEY`.
- Everything else (options, integrations, advanced config) goes in later sections.

## 3. Pick the mock

| Product | Stage mock |
|---|---|
| CLI | terminal: one command or output line per frame |
| Library | code pane + output pane |
| Web / desktop app | real screenshots (`references/screenshots.md`) or a screen mock with the real labels |
| API / service | request card + response card |

The diagram on the left shows **what happens to the reader's thing**: input → processing → output. Nodes light up as the mock reaches them.

## 4. Page order

1. **これは何か** — one diagram: input → what it does → output. One line under it.
2. **5分で動かす** — the stage. Install, first run, see the result. Every command has a copy button. If install differs by OS, use tabs (macOS / Windows / Linux); never three blocks stacked.
3. **覚えるルールは3つ** — rule cards, one rule each, one SVG each. Things the reader must know to not break anything (where output goes, what gets overwritten, how to undo).
4. **よくある使い方** — recipes, one card per goal, titled by the goal (「日付ごとに分けたい」), each with one command and one small before/after diagram.
5. **困ったとき** — one chain per symptom: 症状 → 原因 → 確かめ方 → 対処. Take symptoms from real error messages in the code. Quote the error text exactly.
6. **設定一覧** — a table: name, default, what changes. Reference material, may be long.
7. **用語と FAQ** — in `<details>`.
8. **次の一歩** — links to the real docs, the repo, how to get help.

Leave out: badges, contributor lists, changelog, license text, architecture internals the user doesn't need to use the tool. Link to them at the end if the source has them.

## 5. Writing rules specific to manuals

- Start every step with a verb: 「インストールする」「フォルダを指定する」.
- One step = one action = one frame. If a step has "and", split it.
- Show the expected result right after every action, so the reader can confirm they're on track (「この表示が出れば成功」).
- Say what is safe and what is destructive. Mark destructive commands with a red tag 「元に戻せません」 and show the undo, or the dry run, first.
- Use placeholders that look like placeholders: `<フォルダ>`, `YOUR_API_KEY`. Explain them once in the step caption.
- Never assume prior knowledge the source doesn't state. If the README says "just run `make`", the manual says how to get `make`.

## 6. The five-question test

Before publishing, write down the five questions a stranger would ask and check each answer is visible within one diagram or one card, without opening `<details>`:

1. どうやって入れる？
2. 最初に何を打つ（押す）？
3. 成功したらどう見える？結果はどこ？
4. 間違えたらどう戻す？
5. エラーが出たらどこを見る？

If any answer needs scrolling through paragraphs, redraw that part. Report the five answers' locations in your reply.
