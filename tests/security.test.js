/* The escapes that stand between a hostile string and your encryption key.
 *
 * Why this matters more here than in most apps: LifeHub holds the AES key for your entire cloud
 * snapshot in `localStorage`. A single successful script injection therefore does not merely deface
 * a page — it lifts the key and decrypts everything, offline, permanently. The end-to-end encryption
 * is only ever as strong as the weakest escape in the codebase.
 *
 * Two attacker-reachable routes were real and are covered here: a book cover, which arrives from a
 * remote search result or an imported file and is interpolated into a CSS `url()`; and the import
 * file itself, which used to be trusted wholesale.
 */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright-core");
const { harness, open, ROOT } = require("./_env.js");

/* classic breakouts for a value landing inside url('…') in a style attribute */
const COVER_PAYLOADS = [
  `x'); background:url(javascript:alert(1)); a:('`,
  `x') ; } body { display:none } .z { color:url('`,
  `x" onload="globalThis.__pwned=1`,
  `x'); " onerror="globalThis.__pwned=1`,
  `javascript:globalThis.__pwned=1`,
  `data:text/html;base64,PHNjcmlwdD5nbG9iYWxUaGlzLl9fcHduZWQ9MTwvc2NyaXB0Pg==`,
];

/* a colour lands in a custom property, where a second declaration would escape the slot */
const COLOR_PAYLOADS = [
  `red; background:url(javascript:alert(1))`,
  `#fff; } body { display:none } .x {`,
  `url(javascript:alert(1))`,
  `expression(alert(1))`,
];

async function run() {
  const { state, chk, section } = harness("security");
  const { browser, page, errors } = await open(chromium);
  try {
    section("safeUrl() only lets through what it can vouch for");
    const urls = await page.evaluate((payloads) => ({
      blocked: payloads.map((p) => safeUrl(p)),
      https: safeUrl("https://covers.openlibrary.org/b/id/123-M.jpg"),
      dataOk: safeUrl("data:image/png;base64,iVBORw0KGgo="),
      dataBad: safeUrl("data:text/html;base64,PHNjcmlwdD4="),
      http: safeUrl("http://example.com/a.png"),
      empty: safeUrl(""), nul: safeUrl(null), undef: safeUrl(undefined),
    }), COVER_PAYLOADS);
    chk("every cover payload is rejected outright",
      urls.blocked.every((x) => x === ""), JSON.stringify(urls.blocked));
    chk("a real https cover still passes", urls.https.startsWith("https://"), urls.https);
    chk("a real data:image passes", urls.dataOk.startsWith("data:image/png"), urls.dataOk);
    chk("data:text/html does NOT", urls.dataBad === "", urls.dataBad);
    chk("plain http does not", urls.http === "", urls.http);
    chk("null/undefined/empty are safe", urls.empty === "" && urls.nul === "" && urls.undef === "");

    section("cssVar() cannot be used to open a second declaration");
    const colors = await page.evaluate((payloads) => ({
      blocked: payloads.map((p) => cssVar(p, "FALLBACK")),
      hex: cssVar("#6a5ae0"), hue: cssVar("212"), kw: cssVar("tomato"),
      varRef: cssVar("var(--brand)"), hsl: cssVar("hsl(210 40% 50%)"),
    }), COLOR_PAYLOADS);
    chk("every colour payload falls back",
      colors.blocked.every((x) => x === "FALLBACK"), JSON.stringify(colors.blocked));
    chk("real colours still pass",
      colors.hex === "#6a5ae0" && colors.hue === "212" && colors.kw === "tomato" &&
      colors.varRef === "var(--brand)" && colors.hsl === "hsl(210 40% 50%)",
      JSON.stringify(colors));

    section("A hostile cover renders inert on the real page");
    const live = await page.evaluate(async (payload) => {
      globalThis.__pwned = 0;
      state.reading.books = [{ id: "evil", title: "Evil", author: "x", emoji: "📕",
        cover: payload, genre: "", blurb: "", notes: "", recommenders: [], favorite: false,
        status: "current", pages: 100, page: 1, rating: 0, started: todayIso() }];
      state.habits = [{ id: "evilh", name: "Evil habit", emoji: "😈", kind: "", type: "build",
        color: "red; background:url(javascript:alert(1))", cadence: { mode: "daily" },
        goalIds: [], groupId: "", order: 1, archived: false, archivedOn: "", log: {} }];
      save();
      go("reading"); await new Promise((r) => setTimeout(r, 120));
      const readingHtml = document.querySelector("#view").innerHTML;
      go("habits"); await new Promise((r) => setTimeout(r, 120));
      const habitsHtml = document.querySelector("#view").innerHTML;
      return {
        pwned: globalThis.__pwned,
        /* the payload must not appear as live markup: no injected handler, no javascript: url */
        onload: /\son(load|error|click)\s*=/.test(readingHtml + habitsHtml),
        js: /javascript:/i.test(readingHtml + habitsHtml),
        rendered: readingHtml.length > 40 && habitsHtml.length > 40,
      };
    }, COVER_PAYLOADS[3]);
    chk("no injected handler ran", live.pwned === 0, String(live.pwned));
    chk("no event-handler attribute escaped into the markup", !live.onload);
    chk("no javascript: url reached the markup", !live.js);
    chk("...and the pages still rendered", live.rendered);

    section("Import treats the file as hostile");
    const imported = await page.evaluate(() => {
      const before = JSON.parse(JSON.stringify(state.goals || []));
      /* an export that carries junk alongside real keys */
      const hostile = {
        schema: 1,
        goals: [{ id: "g", title: "kept", emoji: "🎯", type: "checklist", unit: "", direction: "up",
          start: 0, target: 0, deadline: "", note: "", priority: "med", status: "active",
          progress: [], habitIds: [], milestones: [] }],
        __proto__evil: 1,
        cloudSecret: "should not survive",
        constructorHack: { a: 1 },
      };
      const allowed = Object.keys(defaultState());
      const trimmed = {};
      allowed.forEach((k) => { if (k in hostile) trimmed[k] = hostile[k]; });
      if (hostile.schema != null) trimmed.schema = hostile.schema;
      const next = migrate(Object.assign(defaultState(), trimmed));
      return {
        keptGoal: (next.goals[0] || {}).title,
        junkGone: next.cloudSecret === undefined && next.constructorHack === undefined,
        schemaCurrent: next.schema === SCHEMA,
        beforeCount: before.length,
      };
    });
    chk("a legitimate key survives the import", imported.keptGoal === "kept", String(imported.keptGoal));
    chk("unknown top-level keys are stripped", imported.junkGone);
    chk("an old import is run up the migration ladder", imported.schemaCurrent);

    const tooNew = await page.evaluate(() => {
      try { migrate(Object.assign(defaultState(), { schema: 9999 })); return "accepted"; }
      catch (e) { return e.code || e.message; }
    });
    chk("an import from a NEWER LifeHub is refused", tooNew === "schema-too-new", String(tooNew));

    section("The page's own defences");
    const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
    const csp = (html.match(/<meta http-equiv="Content-Security-Policy" content="([\s\S]*?)"/) || [])[1] || "";
    chk("a CSP is present", !!csp);
    chk("...restricting scripts to same-origin", /script-src\s+'self'/.test(csp), csp.slice(0, 60));
    chk("...with no 'unsafe-eval'", !/unsafe-eval/.test(csp));
    chk("...and no inline script allowance", !/script-src[^;]*unsafe-inline/.test(csp));
    chk("object-src is closed", /object-src\s+'none'/.test(csp));
    chk("base-uri is closed", /base-uri\s+'none'/.test(csp));
    /* strip HTML comments first — one of them discusses `<script>` and would otherwise pair with the
       real closing tag further down and look like an inline block */
    const htmlNoComments = html.replace(/<!--[\s\S]*?-->/g, "");
    chk("the page carries no inline <script> for the CSP to have to allow",
      !/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?\S[\s\S]*?<\/script>/i.test(htmlNoComments));
    chk("...and no inline event handlers in the markup",
      !/\s\son[a-z]+\s*=\s*["']/i.test(htmlNoComments));

    section("No secret is shipped in the client");
    const app = fs.readFileSync(path.join(ROOT, "app.js"), "utf8");
    chk("no service_role key", !/service_role|sb_secret_/.test(app));
    chk("no VAPID private key", !/VAPID_PRIVATE/.test(app));
    /* the publishable/anon key IS meant to ship — RLS is what protects the data */
    chk("the anon key is the publishable one", /sb_publishable_/.test(app));
    const sql = fs.readFileSync(path.join(ROOT, "supabase/schema.sql"), "utf8");
    const tables = ["snapshots", "push_subs", "push_schedule"];
    tables.forEach((t) => {
      chk(`${t} has row level security enabled`,
        new RegExp(`alter table public\\.${t} enable row level security`).test(sql));
    });
    chk("every policy has a with-check, so a row cannot be written under another user",
      (sql.match(/with check/g) || []).length >= tables.length,
      String((sql.match(/with check/g) || []).length));
  } finally {
    await browser.close();
  }
  return { pass: state.pass, fail: state.fail, errors };
}

module.exports = { run };
