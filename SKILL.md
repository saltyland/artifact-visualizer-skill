---
name: artifact-visualizer
description: "Build a white-based, diagram-first, animated HTML artifact that explains something so it is understood by looking rather than reading: a live diagram beside a mock (or real screenshot) of the actual screen, driven by a video-style player that advances one change per frame. Also turns a README, docs, --help output, or a codebase into the world's easiest-to-follow manual (説明書・取扱説明書・使い方ガイド・マニュアル). Use whenever the user asks to explain something visually, 図で分かりやすく／視覚的に／アニメーションで／動画みたいに見せたい, to make an HTML page or artifact for a proposal, internal briefing, customer explanation, or onboarding, to turn a design doc, README, requirements, or agreed policy into a page people grasp at a glance, to make a manual or getting-started guide from a README or repository, or says 「いい感じにまとめて」「白基調で分かりやすく」「READMEから説明書を作って」 — even if they don't say 'artifact' or 'animation'."
---

# Artifact Visualizer

Make pages that explain by showing. The reader should understand the mechanism by pressing ▶ and watching one thing change at a time, not by reading paragraphs. Write every user-visible string in the user's language (Japanese if the user writes in Japanese).

There are two modes. Pick one from the request:

| Mode | When | Read first |
|---|---|---|
| **Explainer** | A design, workflow, proposal, policy, or system to be understood | this file |
| **Manual** | A README, docs, CLI, library, or app to be *used* (説明書・使い方・マニュアル・getting started) | this file, then `references/manual-mode.md` |

Bundled files:

- `assets/template-manual.html`: a finished page for a fictional CLI. It has the tokens, big controls, the video-style scrub bar, a diagram whose nodes change state per frame, a terminal mock that appends one line per frame, rule cards with small SVGs, a symptom → cause → fix chain, copy buttons, a glossary and FAQ in `<details>`, and the phone layout. Copy it and replace the data arrays (`NODES`, `EDGES`, `FRAMES`) and the copy. Don't rewrite the player from scratch.
- `scripts/preview.sh`: wraps a page body in the publish skeleton and serves it locally.
- `scripts/shoot.mjs` + `references/screenshots.md`: start the user's own app locally, walk it like an E2E test, and save real screenshots with real data replaced or masked.

## Workflow

1. **Read the source and pin down one thing to animate.** Find the core mechanism: how a request flows through the system, how one answer updates several places, how a command turns input into output. That mechanism becomes the stage. Supporting ideas become small cards.
2. **Choose one concrete example and mark it as fictional.** Use one example throughout. Label it 架空 / 例. Don't use real people's, customers', or companies' names, even when the source contains them.
   - Take the simplest, most common path for the main example. Routing the first example through exceptions and surcharges makes it too complex.
   - Leave out branches, exceptions, and special cases. They belong in later cards.
   - If no real entity fits the simple case, invent one and label it 架空. Don't use a real one whose actual settings differ from what the example shows.
3. **Start the artifact.** Follow the Artifact tool's rules (quickstart first, a plain page). Copy the template, then replace the data and the copy.
4. **Check the page on the machine before publishing** (see Verification).
5. **Publish, then iterate on feedback.** Republish the same file path so the URL stays the same. In each reply, say what changed and what you could not check.

## Design rules

**Look**
- Fix the page to a white background with high contrast. Give `body` an explicit background. A single, deliberate light theme reads best when projected or shared.
- Make SVG text large: node labels at 16–18px bold, edge labels at about 15px. Give edges a stroke width of about 2.6.
- Use a small palette with fixed meanings, the same everywhere:

  | Color | Meaning |
  |---|---|
  | navy | source, input, or what the docs say |
  | green | added or confirmed; success; the next action |
  | red dashed | failure or false |
  | amber | what is being asked, judged, or run right now |
  | near-black | dead or terminal |

- When quantities of different kinds appear together (cost, revenue, fees, profit), give each kind its own hue, and use that hue for that kind everywhere: graph, badges, meters, values in the mock, later charts. Never let two kinds share a hue.

**Density: how much is right**

Treat these as upper bounds, not targets.

| Element | Right amount |
|---|---|
| Section heading | A phrase that states the takeaway. One lead line of about 15–30 characters, or none. |
| Card title | About 18 characters, at most 25. Write the rule itself (「〜は、〜で分ける」), not a topic label. |
| Card body | One SVG plus about 2 pills. About 35 characters of body text outside the SVG. No paragraphs. |
| Pill | About 9 characters, at most about 20. |
| Diagram labels | A number and a noun. Put the explanation in the step caption, one line. |
| Step caption | One line. A formula is fine: 「16,000円 ÷ 80箱 ＝ 1箱 200円」. |
| Section | About 100 characters of text per diagram. A longer section needs more diagrams or less text. |

Only reference material the reader scans may be long: a table, a glossary, an FAQ in collapsed `<details>`, and code blocks.

**What to cut**
- Explanatory paragraphs under a diagram. The diagram should carry the point. If it can't, redraw it.
- Grids of summary facts (founded, head count, version history, badges).
- Click-through explorers that list a screen's contents. They read like a spec sheet.
- Minor rules (alternate names, date exceptions) drawn as diagrams. Move them to a plain-text 補足 at the end of the section.
- "How-to" schedules near the top. Put them after the reader understands the mechanism.
- The complicated variant as the first example. Show the plain path first.

When the user says 「文字を減らして」, delete whole blocks and redraw the point as a diagram. Don't trim sentences.

**Text**
- Replace explanatory text with a visual flow: numbered boxes with arrows, role chips, pills.
- Keep open issues in a collapsed `<details>`.
- Say additions and subtractions outright: 「さらに加算」, 「一律で引かれる」.
- When a number is derived and changes, don't put it in the rule's name. 「一律10%」 reads as fixed. Write 「一律で引かれる」 and label the number 「この例では」.

**One concept per card**
- Give each mechanism or variant its own card. Don't merge four related rules into one explanation.
- Put an overview card with an icon for each variant first, then one card per variant.
- Where a number drives a rule, add a small calculator the reader can edit. Show the correct result and the crossed-out wrong method side by side.

**Showing a split or allocation**
- Make the basis of the split visible. If the reader can't see what the split is based on, they won't notice there is a split.
- Animate one step per frame: the total as one block → redrawn as unit icons → 「÷ 合計 ＝ 1単位あたり」 with each recipient's share shaded in its own tone → each share moves onto its recipient → the amounts appear.
- Show a breakdown as a stack that builds from the bottom in the order the parts accrue. Show a deduction as a dashed slice removed from the part it applies to. Break a very tall base segment with a ≈ mark so small parts stay visible.

**Page order for an explainer or onboarding page**
1. What it is (one diagram)
2. The stage on the simplest path
3. Basic rules
4. Mechanism cards
5. 慣れてきたら (advanced)
6. 補足 (text only)
7. Glossary, FAQ, and scope
8. When to open which screen
9. Finale (optional): a short call to action typed out one character at a time, started when it scrolls into view, with a replay button. At rest, the text is already written.

Manual mode has its own order in `references/manual-mode.md`.

**Stage**
- Put the diagram card on the left and a mock of the actual screen on the right.
- Pick the mock by product:
  - Chat product: app header (name and breadcrumb), a scrolling chat, choice buttons, an input field.
  - Business system: an operation log, one entry per frame: 「画面 › タブ を開く」 divider, a form block with the real field labels, a pressed button 「↑ 押す」, a green system result, an amber warning. The breadcrumb follows the current screen.
  - CLI: a terminal. One command or one output line per frame, prompt in muted gray, success lines green, errors red.
  - Library or API: a code pane and an output pane, or a request / response pair.
- Use the real on-screen labels, commands, and flags, taken from the code or docs.
- **Real screenshots:** use them when the app can run locally and the reader has to recognize the actual screen (onboarding, manuals, change explanations), or when the user asks for 実画面. Follow `references/screenshots.md`. Draw per-frame highlight rings from its `manifest.json` boxes; don't bake them into the image. Keep the hand-built mock when the app can't run, when the screen doesn't exist yet, or when the frame shows a state the app can't reach.
- Put counters, the step title, and the reasoning cycle on the diagram side. Keep them out of the mock.

**Controls**
- Make the ◀ 前へ ／ ▶ 再生 ／ 次へ ▶ buttons big, at least 52px tall.
- Use one continuous scrub bar, like a video player: a fill, a draggable knob, and elapsed / total time.
- Don't show numbered step dots or frame counts.
- Default to 2–2.5 s per frame. Slow down when a frame carries more. Don't cap the total length; clarity beats brevity.

**Frames**
- One frame shows one message or one command: a question, its answer, and the choice made are separate frames.
- A diagram change gets its own frame after the message that causes it.
- Start directly with the first real step. Don't open with a narration frame that says what is about to happen.
- The mock is one cumulative transcript that scrolls. Append each new item and animate only the new one.
- When the user jumps backward, re-render without animation.

**Highlighting and timing**
- Highlight the element being worked on while it is on screen: a thick amber edge, a filled label, a pulsing marker.
- Highlight newly added parts with a halo in the frame where they appear.
- Show a consequence exactly when its cause happens, not a frame later.
- Never highlight something before the actor could logically know it.

**Pacing**
- Break any summary that appears all at once into steps, one row per frame together with the matching diagram path.
- For bulk outcomes, do one explicitly, show a line such as 「このように…なくなるまで続けます」, then resolve the rest with a visible stagger.

**Nesting and openings**
- When one thing contains another, draw the containment: mini graphs inside each box, and a dashed zoom lens from the box to the detailed view.
- An opening selection finishes within about 2 s. The first seconds must never look frozen.

**Honesty**
- Show tags such as 構想段階・未実装 and 例は架空.
- Anything the source doesn't cover is 未確認 or 検討中. Don't present it as decided.
- When part of the source was later superseded, add a one-line banner rather than silently mixing versions.
- Say so when you invent an example reply or an example output.

## Phone layout

Component rules declared later override a media query placed earlier, so put the narrow-screen overrides after the component styles:

- **Stacking:** at 1060px and below, the stage becomes one column and sticky mocks become static.
- **Rows of boxes:** compress them to fit the width rather than scrolling sideways.
- **Graph:** `min-width` of about 720–860px inside an `overflow-x:auto` box, auto-scrolled to the highlighted element on each frame. Show a small 「横にスクロールできます」 hint.
- **Controls and mock:** buttons share one row, the scrub bar goes full width below them, the mock is about 380px tall.

## Verification

Screenshots of a published artifact often fail because of the sign-in wall, so check locally:

1. Run `bash scripts/preview.sh <page.html> [port]` in the background. It wraps the page in the publish skeleton, picks a free port, and serves it.
2. Open the printed URL in a browser. For the phone layout, resize to a mobile viewport and reload.
3. If the browser pane is hidden, `innerWidth` is 0 and measurements are meaningless. Append a fixed-width iframe (1400px and 390px) that loads the same URL, measure inside it, then remove it.
4. Measure with JavaScript instead of trusting screenshots:
   - `document.documentElement.scrollWidth === clientWidth` (no horizontal overflow). Grid children that hold a wide SVG need `minmax(0,1fr)` and `min-width:0`.
   - Overlap between node rects and label rects, and between text boxes, on every frame of every player. Estimate label width at about 15px per full-width character and 8.5px per ASCII character.
   - Text in each SVG stays inside the viewBox.
   - Calculator outputs against worked examples in the source.
   - End positions of moved pieces, measured after the transition finishes.
   - Class state after clicking through frames.
5. Reset the viewport and stop the server when done.

Report what you measured and what you could not see, for example "the look itself is unconfirmed".
