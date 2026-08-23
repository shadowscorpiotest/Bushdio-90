/* Rendering must be a read, and every page must survive being looked at.
 *
 * Two separate promises, both of which have been broken before:
 *
 * 1. `render()` writes nothing. It used to call `checkMissions()`, which saved unconditionally —
 *    and since `save()` marks the cloud dirty and schedules an encrypted upload, merely switching
 *    tabs re-uploaded the entire database. Anything that quietly reintroduces a write inside a
 *    render brings that back.
 *
 * 2. Every view renders, on a seeded profile and on a completely empty one. An empty profile is the
 *    harder case and the one a new user meets first: it is where `[0]`, `.length` on an absent array
 *    and "no data yet" paths actually get exercised.
 */
const { chromium } = require("playwright-core");
const { harness, open, noOverflow } = require("./_env.js");

async function run() {
  const { state, chk, section } = harness("render");
  const { browser, page, errors } = await open(chromium);
  try {
    const views = await page.evaluate(() => Object.keys(VIEWS));
    chk("the view registry is not empty", views.length > 10, `${views.length} views`);

    section("render() performs no storage writes");
    const writes = await page.evaluate(async (names) => {
      /* count every localStorage write, whoever makes it */
      const real = Storage.prototype.setItem;
      let n = 0;
      Storage.prototype.setItem = function (...a) { n++; return real.apply(this, a); };
      const counts = {};
      for (const v of names) {
        go(v);
        await new Promise((r) => setTimeout(r, 40));
        const before = n;
        render(); render(); render();
        counts[v] = n - before;
      }
      /* tab switching inside a page must be free too */
      const beforeTabs = n;
      if (typeof ui === "object") { ui.readingTab = "done"; render(); ui.readingTab = "current"; render(); }
      const tabWrites = n - beforeTabs;

      /* ...but a real change must still persist, or we have proved nothing */
      const beforeReal = n;
      state.xp += 1; save();
      const realWrite = n - beforeReal;

      Storage.prototype.setItem = real;
      return { counts, tabWrites, realWrite };
    }, views);

    const dirty = Object.entries(writes.counts).filter(([, n]) => n > 0);
    chk("three renders of every view write nothing at all",
      dirty.length === 0, dirty.map(([v, n]) => `${v}:${n}`).join(" "));
    chk("switching tabs writes nothing", writes.tabWrites === 0, String(writes.tabWrites));
    chk("...while a genuine change still saves", writes.realWrite > 0, String(writes.realWrite));

    section("Every view renders on a seeded profile");
    const seeded = await page.evaluate(async (names) => {
      const out = {};
      for (const v of names) {
        try {
          go(v);
          await new Promise((r) => setTimeout(r, 40));
          const html = document.querySelector("#view").innerHTML;
          out[v] = html.length > 40 ? "ok" : "empty:" + html.length;
        } catch (e) { out[v] = "threw: " + e.message; }
      }
      return out;
    }, views);
    Object.entries(seeded).forEach(([v, r]) => chk(`${v} renders`, r === "ok", r));

    section("Every view renders on a completely empty profile");
    const empty = await page.evaluate(async (names) => {
      /* not seeded: the state a brand-new person actually starts with */
      state = migrate(defaultState());
      state.profile.onboarded = true;
      save();
      const out = {};
      for (const v of names) {
        try {
          go(v);
          await new Promise((r) => setTimeout(r, 40));
          const html = document.querySelector("#view").innerHTML;
          out[v] = html.length > 40 ? "ok" : "empty:" + html.length;
        } catch (e) { out[v] = "threw: " + e.message; }
      }
      return out;
    }, views);
    Object.entries(empty).forEach(([v, r]) => chk(`${v} renders when there is no data`, r === "ok", r));

    section("...and on a past day, where several pages behave differently");
    const past = await page.evaluate(async () => {
      const y = addDays(todayIso(), -3);
      const out = {};
      for (const v of ["dashboard", "habits", "health", "learning", "journal", "workout"]) {
        try {
          setCursor(v, y);
          go(v);
          await new Promise((r) => setTimeout(r, 40));
          out[v] = document.querySelector("#view").innerHTML.length > 40 ? "ok" : "empty";
        } catch (e) { out[v] = "threw: " + e.message; }
      }
      return out;
    });
    Object.entries(past).forEach(([v, r]) => chk(`${v} renders on a past day`, r === "ok", r));

    section("Layout");
    await page.evaluate(async () => { setCursor("dashboard", todayIso()); go("dashboard"); await new Promise((r) => setTimeout(r, 80)); });
    await noOverflow(page, chk, "dashboard");
    await page.evaluate(async () => { go("health"); await new Promise((r) => setTimeout(r, 80)); });
    await noOverflow(page, chk, "health");
    await page.evaluate(async () => {
      state.profile.theme = "dark"; save(); render();
      if (typeof applyTheme === "function") applyTheme();
      await new Promise((r) => setTimeout(r, 150));
    });
    await noOverflow(page, chk, "health (dark)");
  } finally {
    await browser.close();
  }
  return { pass: state.pass, fail: state.fail, errors };
}

module.exports = { run };
