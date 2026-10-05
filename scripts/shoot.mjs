#!/usr/bin/env node
// Walk a locally running app like an E2E test and save screenshots plus a manifest.
// usage (run from the target project's root so its Playwright is used):
//   node <skill>/scripts/shoot.mjs <scenario.json> [outDir]
// Values written as "$NAME" are read from the environment, so credentials stay out of the scenario file.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const [scenarioPath, outArg] = process.argv.slice(2);
if (!scenarioPath) {
  console.error('usage: node shoot.mjs <scenario.json> [outDir]');
  process.exit(2);
}
const sc = JSON.parse(fs.readFileSync(scenarioPath, 'utf8'));
const outDir = path.resolve(outArg || sc.outDir || path.join(path.dirname(scenarioPath), 'shots'));
fs.mkdirSync(outDir, { recursive: true });

// Resolve Playwright from the project, not from the skill folder, so no extra install is needed.
const req = createRequire(path.join(process.cwd(), 'package.json'));
let chromium;
try {
  ({ chromium } = req('playwright'));
} catch {
  ({ chromium } = req('@playwright/test'));
}

const env = (v) =>
  typeof v === 'string' && /^\$[A-Z0-9_]+$/.test(v)
    ? (process.env[v.slice(1)] ?? fail(`環境変数 ${v.slice(1)} が未設定です`))
    : v;
function fail(msg) {
  throw new Error(msg);
}

const base = new URL(sc.baseURL || 'http://localhost:3000');
// Only local development hosts are allowed so test credentials never leave the machine.
if (!/^(localhost|127\.0\.0\.1|\[::1\])$|\.(localhost|test)$/.test(base.hostname)) {
  fail(`baseURL はローカル開発ホストのみ使えます: ${base.hostname}`);
}

const replacements = [...(sc.replacements || [])];
const forbid = [...(sc.forbid || [])];
// Next.js / Vite dev overlays are not part of the product screen.
const hide = sc.hide ?? ['nextjs-portal', 'vite-error-overlay', '#__next-build-watcher'];
// One map across all shots, so the same real name gets the same fictional label everywhere.
const anonMap = new Map();
const labelSeq = {};
const nthLabel = (n) => {
  let s = '';
  for (n++; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
};

// Collects every distinct text in the given cells and maps it to a label such as 取引先A.
async function collectAnonymize(page) {
  for (const a of sc.anonymize || []) {
    const texts = await page.locator(a.selector).allInnerTexts().catch(() => []);
    for (const raw of texts) {
      const t = raw.trim();
      if (!t || anonMap.has(t) || (a.keep || []).includes(t)) continue;
      labelSeq[a.label] = (labelSeq[a.label] ?? -1) + 1;
      const to = `${a.label}${nthLabel(labelSeq[a.label])}`;
      anonMap.set(t, to);
      // Longer names first, so a name that contains a shorter one is swapped whole.
      replacements.push({ from: t, to });
      replacements.sort((x, y) => y.from.length - x.from.length);
      forbid.push(t);
    }
  }
}
const manifest = { baseURL: base.href, viewport: null, shots: [] };

// Rewrites visible text, input values and titles in place before each shot.
async function applyReplacements(page) {
  if (!replacements.length) return;
  await page.evaluate((reps) => {
    const swap = (s) => reps.reduce((t, r) => t.split(r.from).join(r.to), s);
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const next = swap(n.nodeValue);
      if (next !== n.nodeValue) n.nodeValue = next;
    }
    for (const el of document.querySelectorAll('input,textarea')) {
      if (el.value) el.value = swap(el.value);
      if (el.placeholder) el.placeholder = swap(el.placeholder);
    }
    for (const el of document.querySelectorAll('[title],[aria-label]')) {
      for (const a of ['title', 'aria-label']) {
        const v = el.getAttribute(a);
        if (v) el.setAttribute(a, swap(v));
      }
    }
  }, replacements);
}

// Fails the run when a string that must not be published is still on screen.
async function checkForbidden(page, name) {
  if (!forbid.length) return;
  const text = await page.evaluate(() => {
    const vals = [...document.querySelectorAll('input,textarea,select')].map((e) => e.value || '');
    return document.body.innerText + '\n' + vals.join('\n');
  });
  const hits = forbid.filter((f) => text.includes(f));
  if (hits.length) fail(`${name}: 公開不可の文字列が残っています（${hits.length}件）。replacements か mask を追加してください`);
}

async function boxOf(page, selector) {
  const box = await page.locator(selector).first().boundingBox();
  return box && { x: Math.round(box.x), y: Math.round(box.y), w: Math.round(box.width), h: Math.round(box.height) };
}

const browser = await chromium.launch();
try {
  const viewport = sc.viewport || { width: 1440, height: 900 };
  manifest.viewport = viewport;
  const context = await browser.newContext({
    baseURL: base.href,
    viewport,
    deviceScaleFactor: sc.deviceScaleFactor || 2,
    locale: 'ja-JP',
    storageState: sc.storageState && fs.existsSync(sc.storageState) ? sc.storageState : undefined,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(sc.timeout || 45000);

  if (sc.login) {
    const l = sc.login;
    try {
      await page.goto(l.url || '/login');
      for (const [sel, val] of Object.entries(l.fields || {})) await page.fill(sel, env(val));
      await page.click(l.submit || 'button[type="submit"]');
      if (l.waitForURL) await page.waitForURL(new URL(l.waitForURL, base).href);
      else await page.waitForLoadState('networkidle');
    } catch (e) {
      const errFile = path.join(outDir, '_error-login.png');
      await page.screenshot({ path: errFile }).catch(() => {});
      throw new Error(`ログインで失敗: ${e.message.split('\n')[0]}\n失敗時の画面: ${errFile}（テストユーザーが接続先DBに無い可能性も確認）`);
    }
  }

  let i = 0;
  for (const step of sc.steps || []) {
    i++;
    const label = step.shot || Object.keys(step)[0];
    try {
      if (step.goto) {
        await page.goto(step.goto);
        await page.waitForLoadState('networkidle').catch(() => {});
      }
      if (step.click) await page.locator(step.click).first().click();
      if (step.fill) await page.locator(step.fill[0]).first().fill(String(env(step.fill[1])));
      if (step.select) await page.locator(step.select[0]).first().selectOption(step.select[1]);
      if (step.press) await page.keyboard.press(step.press);
      if (step.hover) await page.locator(step.hover).first().hover();
      if (step.scrollTo) await page.locator(step.scrollTo).first().scrollIntoViewIfNeeded();
      if (step.waitFor) await page.locator(step.waitFor).first().waitFor();
      if (step.waitForResponse) await page.waitForResponse((r) => r.url().includes(step.waitForResponse));
      if (typeof step.wait === 'number') await page.waitForTimeout(step.wait);

      if (step.shot) {
        // Park the cursor so hover tooltips don't leak into the shot, unless the step hovers on purpose.
        if (!step.hover) await page.mouse.move(0, 0);
        await page.waitForTimeout(step.settle ?? 400);
        if (hide.length) await page.addStyleTag({ content: `${hide.join(',')}{display:none!important}` });
        await collectAnonymize(page);
        await applyReplacements(page);
        await checkForbidden(page, step.shot);
        const mask = [...(sc.mask || []), ...(step.mask || [])].map((s) => page.locator(s));
        const file = path.join(outDir, `${step.shot}.png`);
        const opts = { path: file, mask, maskColor: '#d9dde3', animations: 'disabled' };
        let origin = { x: 0, y: 0 };
        if (step.clip) {
          const c = await boxOf(page, step.clip);
          if (!c) fail(`clip の要素が見つかりません: ${step.clip}`);
          opts.clip = { x: c.x, y: c.y, width: c.w, height: c.h };
          origin = { x: c.x, y: c.y };
        } else if (step.fullPage) {
          opts.fullPage = true;
          origin = await page.evaluate(() => ({ x: -window.scrollX, y: -window.scrollY }));
        }
        await page.screenshot(opts);
        // Boxes are in CSS pixels relative to the saved image, so the page can draw rings over it.
        const highlights = [];
        for (const h of [].concat(step.highlight || [])) {
          const b = await boxOf(page, h);
          if (b) highlights.push({ selector: h, x: b.x - origin.x, y: b.y - origin.y, w: b.w, h: b.h });
          else console.warn(`⚠ ${step.shot}: highlight の要素が見つかりません: ${h}`);
        }
        const size = opts.clip
          ? { width: opts.clip.width, height: opts.clip.height }
          : step.fullPage
            ? await page.evaluate(() => ({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight }))
            : viewport;
        manifest.shots.push({ name: step.shot, file: path.basename(file), url: page.url().replace(base.origin, ''), caption: step.caption || '', size, highlights });
        console.log(`📸 ${step.shot}.png`);
      }
    } catch (e) {
      const errFile = path.join(outDir, `_error-step${i}.png`);
      await page.screenshot({ path: errFile }).catch(() => {});
      throw new Error(`step ${i} (${label}) で失敗: ${e.message}\n失敗時の画面: ${errFile}`);
    }
  }

  if (sc.saveStorageState) await context.storageState({ path: sc.saveStorageState });
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  // Only the count goes to stdout; the originals must not end up in chat or logs.
  if (anonMap.size) console.log(`🔒 自動匿名化: ${anonMap.size} 件（${[...new Set(anonMap.values())].slice(0, 5).join(', ')}…）`);
  console.log(`✅ ${manifest.shots.length} 枚 → ${outDir}`);
} finally {
  await browser.close();
}
