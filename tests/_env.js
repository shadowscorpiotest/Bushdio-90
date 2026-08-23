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

/* Where a Chromium actually is. Playwright keeps browsers in a versioned directory whose name
 * changes with every release, so we look for one rather than naming a build that will be wrong in a
 * month. Order: an explicit override, this container's PLAYWRIGHT_BROWSERS_PATH, then the default
 * cache that `playwright-core install` writes to on CI. */
const BIN = [
  "chrome-linux/chrome",
  "chrome-linux/headless_shell",
  "chrome-mac/Chromium.app/Contents/MacOS/Chromium",
  "chrome-win/chrome.exe",
];
function findExec() {
  if (process.env.LIFEHUB_CHROME) return process.env.LIFEHUB_CHROME;
  const roots = [
    process.env.PLAYWRIGHT_BROWSERS_PATH,
    path.join(os.homedir(), ".cache/ms-playwright"),
    path.join(os.homedir(), "Library/Caches/ms-playwright"),
    path.join(process.env.LOCALAPPDATA || "", "ms-playwright"),
  ].filter(Boolean);
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
  for (const d of dirs) for (const bin of BIN) {
    const p = path.join(d, bin);
    if (fs.existsSync(p)) return p;
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

module.exports = { ROOT, APP, ARTIFACTS, EXEC, harness, open, noOverflow };
