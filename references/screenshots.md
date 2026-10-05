# Real screenshots of the user's own app

Capture the real app screen for pages people will read. Run the app locally, script the path to each screen like an E2E test, and save PNGs that are safe to publish.

A browser tool's screenshot usually only returns an image to the model and saves no file. Use `scripts/shoot.mjs` (Playwright) for anything that goes onto a page.

## 1. Decide the shots
- One shot per state the reader has to recognize. For a stage, that means one shot per frame that changes the screen.
- For each shot, write down the screen, the state it must be in (tab, filled form, result shown), and what to highlight.
- Take labels, routes, and selectors from the code and the existing E2E specs. Don't guess them.

## 2. Find out how the app starts
Read before starting anything: dev-server config, `package.json` scripts, the README setup section, `playwright.config.*`, the E2E global setup and test-user files, and the project's `CLAUDE.md` / agent notes for how the DB is started.

## 3. Start it
- Start the DB the way the project says to. Start the dev server with the environment's preview / dev-server tool rather than a raw background shell when one exists.
- Confirm the server responds before shooting. Dev servers that compile per route (Next.js, Vite) need each route warmed up; allow 45 s timeouts.
- Don't run a production build in the same working tree while the dev server is running; it can stop the server.

## 4. Write the scenario
Write a scenario JSON in a scratch folder, not in the repo:

```json
{
  "baseURL": "http://localhost:3000",
  "viewport": { "width": 1440, "height": 900 },
  "deviceScaleFactor": 2,
  "login": {
    "url": "/login",
    "fields": { "#email": "$SHOT_EMAIL", "#password": "$SHOT_PASSWORD" },
    "submit": "button[type=\"submit\"]",
    "waitForURL": "/"
  },
  "anonymize": [{ "selector": "tbody td:nth-child(3)", "label": "取引先" }],
  "replacements": [{ "from": "Real Customer Inc.", "to": "架空商事" }],
  "forbid": ["Real Customer Inc."],
  "mask": ["tbody td:nth-child(7)"],
  "steps": [
    { "goto": "/orders" },
    { "click": "button:has-text(\"新規\")" },
    { "waitFor": "text=注文登録" },
    { "shot": "01-orders-new", "caption": "注文の新規登録", "highlight": "button:has-text(\"保存\")" },
    { "fill": ["#quantity", "10"] },
    { "shot": "02-form", "clip": "form", "highlight": ["#quantity"] }
  ]
}
```

- A step may do several things, in this order: `goto` → `click` → `fill` → `select` → `press` → `hover` → `scrollTo` → `waitFor` → `waitForResponse` → `wait` → `shot`.
- A `shot` takes `clip` (selector to crop to), `fullPage`, `mask`, `highlight` (one or several selectors), `caption`, and `settle` (ms; default 400).
- `anonymize` renames every distinct text in the given cells to `label` + A, B, C…, consistently across the page and all shots, and adds each original to `forbid`. Use `keep` for values such as 「-」.
- Before each shot the script parks the cursor (no stray tooltips) and hides dev overlays (override with `hide`).
- Values written as `"$NAME"` come from environment variables, so credentials stay out of files and chat.
- Use only test accounts from the project's E2E setup, seed, or example config. Never a real password.
- `baseURL` must be a local development host; the script refuses anything else.

## 5. Shoot
Run from the target project's root, so the project's own Playwright is used:

```bash
SHOT_EMAIL=... SHOT_PASSWORD=... node <this-skill>/scripts/shoot.mjs <scratch>/scenario.json <scratch>/shots
```

- Output: `NN-name.png` per shot and `manifest.json` with each shot's size, URL, caption, and highlight boxes (CSS pixels, relative to the image).
- On failure the script saves `_error-stepN.png` / `_error-login.png`. Read it, fix the selector or wait, rerun. A leak failure saves the screen with the leak in it, so never publish `_error-*` files.
- A login failure often means the test user exists only in a separate E2E database.
- If Chromium is missing, `npx playwright install chromium` (ask first; it downloads a browser).

## 6. Look at every image before publishing (mandatory)
- Real customer names, people's names, emails, phone numbers, addresses, prices, and amounts must not appear unless the user said they may.
- Fix with `replacements` (swap for a label marked 架空), `mask` (gray out), or a DB seeded with fictional data only.
- Put every replaced original into `forbid` too, so the run fails if one survives (for example inside a chart). Don't paste those strings into chat.
- `anonymize` and `replacements` match exact strings only. Look for fragments, such as a customer name in parentheses inside a product name.
- Replacing text changes column widths; pick mask targets by column position (`td:nth-child(n)`), not pixels.
- `<canvas>` charts and text in images can't be rewritten. Mask or crop them. Keep the cursor off charts, since tooltips show real values.

## 7. Put them on the page
- Several or large shots: upload as artifact assets (declare the assets capability) and use the returned URLs exactly.
- A few small cropped shots: inline as `data:` URIs, keeping the page under 16MB.
- Draw highlights on the page, not into the PNG: a ring over the image from `manifest.json`, scaled by `displayedWidth / size.width`, so it can animate per frame.
- Label each shot, for example 「実際の画面（データは架空に置換）」.

## 8. Clean up
- Screenshots, scenarios, and manifests stay in the scratch folder. Don't commit them.
- DB changes made only for shooting (test users, demo rows) stay out of pull requests.
- Stop the servers you started. Report which shots were taken, what was replaced or masked, and what you could not capture.
