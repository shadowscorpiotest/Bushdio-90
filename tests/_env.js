/* Shared environment for every suite.
 *
 * The suites this replaces hardcoded `/home/user/Bushdio-90/index.html` and one exact browser build
 * (`chromium_headless_shell-1194`). That meant they ran in precisely one container and nowhere else —
 * which is why they could never gate a pull request, and why a container reclaim destroyed the lot.
 * Everything here is resolved at run time, not assumed.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

/* The repo, found from this file's own location. */
const ROOT = path.resolve(__dirname, "..");
const APP = "file://" + path.join(ROOT, "index.html");

/* Screenshots and other debris. Inside the repo so CI can upload it as an artifact, and gitignored
 * so it can never land in a commit. */
const ARTIFACTS = path.join(__dirname, ".artifacts");

/* Where a Chromium actually is.
 *
 * Playwright keeps browsers in a versioned directory, and the layout INSIDE that directory is not
 * stable either: builds up to ~1194 unpack to `chrome-linux/chrome`, while newer ones ship Chrome
 * for Testing as `chrome-linux64/chrome`. A hardcoded list of relative paths gets this wrong every
 * time the upstream layout moves — it already did, silently passing here and failing on CI.
 *
 * So we ask, in order:
 *   1. an explicit override, for anyone with their own build;
 *   2. playwright-core itself, which knows the exact path for the version installed alongside it —
 *      but only if that path really exists, since a preinstalled container browser is often a
 *      different build number than the npm package expects;
 *   3. a search of the browser caches that looks for a FILE BY NAME at any depth, so it does not
 *      care what the enclosing folder is called this year.
 */
const BIN_NAMES = ["chrome", "headless_shell", "chrome-headless-shell", "Chromium", "chrome.exe"];

/* the versioned dirs hold a handful of entries; a depth cap keeps this from walking a whole profile */
function findBinary(dir, depth = 0) {
  if (depth > 4) return null;
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return null; }
  for (const e of entries) {
    if (e.isFile() && BIN_NAMES.includes(e.name)) return path.join(dir, e.name);
  }
  for (const e of entries) {
    if (e.isDirectory()) {
      const hit = findBinary(path.join(dir, e.name), depth + 1);
      if (hit) return hit;
    }
  }
  return null;
}

/* filled in by findExec, so a failure can report where it looked instead of just "not found" */
const SEARCHED = [];

function findExec() {
  if (process.env.LIFEHUB_CHROME) return process.env.LIFEHUB_CHROME;

  try {
    const p = require("playwright-core").chromium.executablePath();
    SEARCHED.push(`playwright-core expects ${p}${fs.existsSync(p) ? "" : " (missing)"}`);
    if (p && fs.existsSync(p)) return p;
  } catch (e) {
    SEARCHED.push("playwright-core could not name a browser: " + e.message.split("\n")[0]);
  }

  const roots = [
    process.env.PLAYWRIGHT_BROWSERS_PATH,
    path.join(os.homedir(), ".cache/ms-playwright"),
    path.join(os.homedir(), "Library/Caches/ms-playwright"),
    path.join(process.env.LOCALAPPDATA || "", "ms-playwright"),
  ].filter(Boolean);
  roots.forEach((r) => SEARCHED.push(`${r}${fs.existsSync(r) ? "" : " (no such directory)"}`));
  const dirs = [];
  for (const r of roots) {
    if (!fs.existsSync(r)) continue;
    for (const d of fs.readdirSync(r)) {
      if (/^chromium(-|_|$)/.test(d)) dirs.push(path.join(r, d));
    }
  }
  /* prefer a full chromium over the headless shell: the shell cannot do everything, and a suite that
   * needs a real browser should not fail mysteriously */
  dirs.sort((a, b) => (/headless/.test(a) ? 1 : 0) - (/headless/.test(b) ? 1 : 0));
  for (const d of dirs) {
    const hit = findBinary(d);
    if (hit) return hit;
  }
  return null;
}

const EXEC = findExec();

/* ---- the tiny assertion harness every suite shares ---- */
function harness(name) {
  const state = { pass: 0, fail: 0, name, errors: [] };
  const chk = (label, ok, extra = "") => {
    if (ok) state.pass++; else state.fail++;
    console.log((ok ? "  ok   " : "  FAIL ") + label + (extra ? " — " + extra : ""));
  };
  const section = (t) => console.log("\n" + t);
  return { state, chk, section };
}

/* Opens the app with console/page errors collected. Google Fonts is fetched over the network and is
 * not available in every sandbox, so its failure is not a test failure. */
async function open(chromium, { width = 390, height = 900 } = {}) {
  const browser = await chromium.launch({ executablePath: EXEC, headless: true });
  const page = await (await browser.newContext({ viewport: { width, height } })).newPage();
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error" && !/ERR_CONNECTION|ERR_NAME|ERR_INTERNET|fonts\.googleapis|fonts\.gstatic/.test(m.text())) {
      errors.push("console: " + m.text());
    }
  });
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  await page.goto(APP);
  /* `SCHEMA` is a top-level `const` in a classic script, so it lives in the global LEXICAL scope and
   * is never a property of `window` — `typeof window.SCHEMA` would wait forever. */
  await page.waitForFunction(() => typeof SCHEMA === "number", null, { timeout: 15000 });
  /* the onboarding sheet opens on a fresh profile and would swallow clicks */
  await page.evaluate(() => { const b = document.querySelector("#modalBackdrop"); if (b) b.hidden = true; });
  return { browser, page, errors };
}

/* No horizontal scrollbar, at phone and desktop width, in both themes. Every suite that renders a
 * page should end with this. */
async function noOverflow(page, chk, label) {
  const at = async (w) => {
    await page.setViewportSize({ width: w, height: 900 });
    await page.waitForTimeout(120);
    return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  };
  chk(`${label}: no horizontal overflow @390`, await at(390));
  chk(`${label}: no horizontal overflow @1280`, await at(1280));
  await page.setViewportSize({ width: 390, height: 900 });
}

module.exports = { ROOT, APP, ARTIFACTS, EXEC, SEARCHED, harness, open, noOverflow };
