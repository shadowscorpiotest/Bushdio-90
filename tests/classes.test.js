/* A class package must remember the terms it has already been through.
 *
 * Renewing used to run `c.log = []`. The dates of every session in the term you had just paid off
 * were deleted outright — and that is precisely the record you want when you are deciding whether
 * the studio is worth another eight sessions. Nothing warned you, and there was no undo.
 *
 * These assertions exist because that data loss was silent and permanent. The migration cannot
 * bring back what the old code destroyed, so the other thing being pinned here is honesty: the
 * package must SAY that earlier terms have no recorded dates rather than showing an empty list as
 * though you had never attended.
 */
const { chromium } = require("playwright-core");
const { harness, open } = require("./_env.js");

async function run() {
  const { state, chk, section } = harness("classes");
  const { browser, page, errors } = await open(chromium);
  try {
    section("A save from before terms were kept");
    const migrated = await page.evaluate(() => {
      /* schema 26: a package renewed twice, so two terms of dates are already gone for good */
      const old = Object.assign(defaultState(), {
        schema: 26,
        workout: { weeklyGoal: 5, plan: [], log: {}, sessions: [], skills: [], classes: [
          { id: "c1", name: "Yoga studio", total: 8, price: 120, cur: "usd",
            start: "2026-07-01", log: ["2026-07-03", "2026-07-08"], renewals: 2 },
        ] },
      });
      const s = migrate(old);
      const c = s.workout.classes[0];
      state = s; save();
      return { terms: c.terms, paidOn: c.paidOn, receipt: c.receipt, renewals: c.renewals,
        log: c.log, lost: classLostTerms(c), spend: classSpend(c) };
    });
    chk("the package gains a place to keep terms", Array.isArray(migrated.terms), String(migrated.terms));
    chk("...which is empty, because the old dates are genuinely gone",
      migrated.terms.length === 0, String(migrated.terms.length));
    chk("the current term's dates are untouched", migrated.log.length === 2, migrated.log.join(","));
    chk("the two vanished terms are still COUNTED, not forgotten", migrated.lost === 2, String(migrated.lost));
    chk("...and still paid for — 3 terms at 120", migrated.spend === 360, String(migrated.spend));
    chk("a receipt slot exists for the current term", migrated.receipt === null, String(migrated.receipt));

    section("Attending: one path, and it refuses what it should");
    const attend = await page.evaluate(() => {
      const c = classById("c1");
      c.log = []; c.total = 3; save();
      const out = {};
      out.today = attendClass("c1", todayIso());
      out.xpForToday = true;
      out.twiceSameDay = attendClass("c1", todayIso());          // already ticked that date
      out.past = attendClass("c1", addDays(todayIso(), -2));
      out.future = attendClass("c1", addDays(todayIso(), 1));    // cannot attend ahead of time
      out.dates = classDates(c);
      out.third = attendClass("c1", addDays(todayIso(), -5));
      out.full = classFull(c);
      out.fourth = attendClass("c1", addDays(todayIso(), -6));   // package is spent
      return out;
    });
    chk("a session today is recorded", attend.today === true);
    chk("the same day twice is refused", attend.twiceSameDay === false);
    chk("a past day you forgot is accepted", attend.past === true);
    chk("a future day is refused", attend.future === false);
    chk("dates come back newest first", attend.dates[0] > attend.dates[1], attend.dates.join(","));
    chk("the package fills up", attend.full === true);
    chk("...and refuses a session beyond its total", attend.fourth === false);

    section("Filling the package leaves a reminder you can still see tomorrow");
    /* the old code raised a toast, which is gone the moment you look away */
    const remind = await page.evaluate(() => {
      const todo = state.todos.filter(t => /Renew Yoga studio/.test(t.text));
      return { count: todo.length, date: (todo[0] || {}).date, done: (todo[0] || {}).done,
        area: (todo[0] || {}).areaId, today: todayIso() };
    });
    chk("a real task is written, not just a toast", remind.count === 1, String(remind.count));
    chk("...onto today", remind.date === remind.today, String(remind.date));
    chk("...unticked, filed under Finance", remind.done === false && remind.area === "finance",
      String(remind.area));

    const noDupe = await page.evaluate(() => {
      const c = classById("c1");
      remindRenewal(c); remindRenewal(c);          // finishing again must not stack reminders
      return state.todos.filter(t => /Renew Yoga studio/.test(t.text)).length;
    });
    chk("finishing again does not stack a second identical reminder", noDupe === 1, String(noDupe));

    section("Renewing KEEPS the term it just finished");
    const renewed = await page.evaluate(() => {
      const c = classById("c1");
      const before = classDates(c).slice();
      c.paidOn = "2026-08-01";
      c.receipt = { id: "receipt-1", kind: "image" };
      SUBMITS["class-renew"]({ id: "c1", total: "10", price: "150", start: todayIso(), paidOn: todayIso() });
      save();
      const t = (c.terms || [])[0] || {};
      return {
        before,
        keptDates: (t.dates || []).slice().sort(),
        keptPrice: t.price, keptPaidOn: t.paidOn,
        keptReceipt: t.receipt && t.receipt.id,
        nowLog: c.log.length, nowTotal: c.total, nowPrice: c.price,
        nowReceipt: c.receipt, renewals: c.renewals, lost: classLostTerms(c),
        spend: classSpend(c),
      };
    });
    chk("every date of the finished term survives",
      renewed.keptDates.join(",") === renewed.before.slice().sort().join(","),
      `${renewed.keptDates.join(",")} vs ${renewed.before.slice().sort().join(",")}`);
    chk("...with the price that term actually cost", renewed.keptPrice === 120, String(renewed.keptPrice));
    chk("...and its own receipt", renewed.keptReceipt === "receipt-1", String(renewed.keptReceipt));
    chk("the new term starts empty", renewed.nowLog === 0, String(renewed.nowLog));
    chk("...with the new size and price", renewed.nowTotal === 10 && renewed.nowPrice === 150,
      `${renewed.nowTotal} × ${renewed.nowPrice}`);
    chk("...and its own blank receipt slot, not the old one",
      renewed.nowReceipt === null, String(renewed.nowReceipt));
    chk("the count of terms paid for goes up", renewed.renewals === 3, String(renewed.renewals));
    chk("the two undated terms are still reported as undated", renewed.lost === 2, String(renewed.lost));
    /* 150 current + 120 recorded term + 2 lost terms assumed at the current 150 */
    chk("the total is exact for the term it knows, assumed only where it must",
      renewed.spend === 150 * 3 + 120, String(renewed.spend));

    section("The sheet shows the dates, the money and what it cannot know");
    const sheet = await page.evaluate(async () => {
      const kept = ((classById("c1").terms || [])[0] || {}).dates || [];
      openClassDetail("c1");
      await new Promise((r) => setTimeout(r, 80));
      const body = document.querySelector(".modal-body");
      const text = (body ? body.textContent : "").replace(/\s+/g, " ");
      closeModal();
      /* the day-of-month of each archived date, as the list actually prints it */
      const shown = kept.map((d) => +d.slice(8, 10))
        .filter((day) => new RegExp(`\\b${day}\\b`).test(text));
      return { text, keptCount: kept.length, shownCount: shown.length };
    });
    chk("it states the fraction of the term used", /\b0\b[\s\S]{0,12}of[\s\S]{0,12}\b10\b/.test(sheet.text),
      sheet.text.slice(0, 90));
    chk("it lists every date of the earlier term",
      sheet.keptCount === 3 && sheet.shownCount === 3, `${sheet.shownCount} of ${sheet.keptCount} shown`);
    chk("...under a heading that says they are earlier terms",
      /Earlier terms/.test(sheet.text));
    chk("...and the current term says it is empty rather than showing a blank",
      /No sessions recorded in this term/.test(sheet.text));
    chk("it says plainly that two terms have no recorded dates",
      /2 earlier terms .*aren't recorded/.test(sheet.text), sheet.text.slice(0, 200));
    chk("...and still counts them in the total", /Total on this package/.test(sheet.text));

    section("A package with no history at all still renders");
    const fresh = await page.evaluate(async () => {
      state = migrate(defaultState());
      state.profile.onboarded = true;
      SUBMITS["class-add"]({ name: "Pilates", total: "6", price: "0", cur: "usd", start: todayIso() });
      save();
      const c = state.workout.classes[0];
      openClassDetail(c.id);
      await new Promise((r) => setTimeout(r, 80));
      const text = document.querySelector(".modal-body").textContent.replace(/\s+/g, " ");
      closeModal();
      go("workout");
      await new Promise((r) => setTimeout(r, 60));
      return { text, listed: document.querySelector("#view").innerHTML.includes("Pilates"),
        terms: c.terms.length, lost: classLostTerms(c) };
    });
    chk("a brand-new package has no terms and nothing missing",
      fresh.terms === 0 && fresh.lost === 0, `${fresh.terms}/${fresh.lost}`);
    chk("...says no sessions are recorded yet rather than showing a blank",
      /No sessions recorded/.test(fresh.text), fresh.text.slice(0, 120));
    chk("...does NOT claim any term is missing dates", !/earlier term/.test(fresh.text));
    chk("...and appears on the Workout page", fresh.listed);
  } finally {
    await browser.close();
  }
  return { pass: state.pass, fail: state.fail, errors };
}

module.exports = { run };
