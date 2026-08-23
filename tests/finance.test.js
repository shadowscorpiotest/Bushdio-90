/* Where the money actually goes.
 *
 * The one rule this file exists to protect is the app's oldest money discipline: dollars and toman
 * are never added together. There is no exchange rate unless you gave the app one, so a single
 * merged number would be a confident lie. Every total here is bucketed per currency, and the
 * percentage shares are computed within a currency — a bar comparing 68 dollars against 900,000
 * toman would be a picture of nothing.
 */
const { chromium } = require("playwright-core");
const { harness, open, noOverflow } = require("./_env.js");

async function run() {
  const { state, chk, section } = harness("finance");
  const { browser, page, errors } = await open(chromium);
  try {
    const seeded = await page.evaluate(() => {
      state = migrate(defaultState());
      state.profile.onboarded = true;
      state.finance.entries = [];
      const t = todayIso();
      const E = (d, amount, category, cur, type) => state.finance.entries.push({
        id: uid(), date: d, type: type || "expense", amount, cur: cur || "USD",
        category, note: "" });
      /* this month */
      E(addDays(t, -1), 60, "Food"); E(addDays(t, -2), 40, "Food"); E(addDays(t, -3), 100, "Bills");
      E(addDays(t, -4), 2400, "Salary", "USD", "income");     // income must not appear in spending
      /* last month — only "all time" should see it */
      E(addDays(t, -45), 500, "Shopping");
      /* a second currency */
      E(addDays(t, -5), 900000, "Transport", "IRT");
      save();
      return { today: t };
    });
    chk("a month of entries is seeded", !!seeded.today);

    section("This month, by category, biggest first");
    const month = await page.evaluate(() => {
      const by = spendByCategory("month");
      return {
        curs: Object.keys(by).sort(),
        usdOrder: by.USD.rows.map(r => r.name),
        usdAmounts: by.USD.rows.map(r => r.amount),
        usdTotal: by.USD.total,
        usdCount: by.USD.n,
        foodEntries: by.USD.rows.find(r => r.name === "Food").n,
        irt: by.IRT.total,
      };
    });
    chk("expenses are grouped by category", month.usdOrder.length === 2, month.usdOrder.join(","));
    chk("...biggest first", month.usdOrder[0] === "Food" && month.usdAmounts[0] === 100,
      `${month.usdOrder[0]} ${month.usdAmounts[0]}`);
    chk("...summing the entries within a category", month.foodEntries === 2, String(month.foodEntries));
    chk("income is NOT counted as spending", !month.usdOrder.includes("Salary"), month.usdOrder.join(","));
    chk("last month's spend is excluded", !month.usdOrder.includes("Shopping"), month.usdOrder.join(","));
    chk("the month total is the sum of its categories", month.usdTotal === 200, String(month.usdTotal));
    chk("...over the right number of entries", month.usdCount === 3, String(month.usdCount));

    section("Two currencies are never added together");
    chk("each currency gets its own bucket", month.curs.join(",") === "IRT,USD", month.curs.join(","));
    chk("the toman is kept whole, in its own total", month.irt === 900000, String(month.irt));
    chk("...and is nowhere in the dollar total", month.usdTotal === 200, String(month.usdTotal));

    section("All time reaches further back");
    const all = await page.evaluate(() => {
      const by = spendByCategory("all");
      return { order: by.USD.rows.map(r => r.name), total: by.USD.total, n: by.USD.n };
    });
    chk("an older month now appears", all.order.includes("Shopping"), all.order.join(","));
    chk("...and leads, being the largest", all.order[0] === "Shopping", all.order[0]);
    chk("the all-time total includes it", all.total === 700, String(all.total));
    chk("...across every expense, income still excluded", all.n === 4, String(all.n));

    section("Every category has a colour, and it is stable");
    const colors = await page.evaluate(() => {
      const cats = EXPENSE_CATS.concat(INCOME_CATS);
      const map = {};
      cats.forEach(c => { map[c] = catColor(c); });
      const values = EXPENSE_CATS.filter(c => c !== "Other").map(c => catColor(c));
      return {
        map, unique: new Set(values).size, count: values.length,
        unknown: catColor("Something I invented"),
        other: catColor("Other"),
        allHex: cats.every(c => /^#[0-9a-f]{6}$/i.test(catColor(c))),
      };
    });
    chk("every category resolves to a real colour", colors.allHex, JSON.stringify(colors.map).slice(0, 80));
    chk("no two spending categories share one", colors.unique === colors.count,
      `${colors.unique} distinct of ${colors.count}`);
    chk("an unknown category falls back rather than breaking",
      colors.unknown === colors.other, colors.unknown);

    section("A hostile category name cannot escape into the stylesheet");
    /* the colour is interpolated into a style attribute, so it goes through cssVar like every other */
    const hostile = await page.evaluate(() => {
      globalThis.__pwned = 0;
      state.finance.entries.push({ id: uid(), date: todayIso(), type: "expense", amount: 5,
        cur: "USD", category: "red; background:url(javascript:alert(1))", note: "" });
      save();
      go("finance");
      return new Promise((r) => setTimeout(() => {
        const view = document.querySelector("#view");
        const html = view.innerHTML;
        /* The payload DOES appear on the page — as the category's name, escaped, which is exactly
         * right: you typed it, so you should see it. What must never happen is it reaching a style
         * attribute or becoming markup. So check the style attributes themselves, not the page. */
        const styles = [...view.querySelectorAll("[style]")].map((e) => e.getAttribute("style"));
        r({
          pwned: globalThis.__pwned,
          badStyle: styles.filter((s) => /javascript:|url\s*\(|expression/i.test(s)),
          handler: /\son(load|error|click)\s*=/.test(html),
          shownAsText: [...view.querySelectorAll("b")].some((b) => b.textContent.includes("javascript:alert(1)")),
          rendered: html.length > 200,
        });
      }, 120));
    });
    chk("nothing ran", hostile.pwned === 0, String(hostile.pwned));
    chk("no style attribute carries a url, javascript: or expression",
      hostile.badStyle.length === 0, hostile.badStyle.join(" | "));
    chk("no event handler was injected", !hostile.handler);
    chk("the name is shown as inert TEXT, not swallowed and not executed", hostile.shownAsText);
    chk("...and the page still rendered", hostile.rendered);

    section("The card itself");
    const card = await page.evaluate(async () => {
      go("finance");
      await new Promise((r) => setTimeout(r, 120));
      const text = document.querySelector("#view").textContent.replace(/\s+/g, " ");
      return {
        hasCard: /Where it goes/.test(text),
        bothScopes: /This month/.test(text) && /All time/.test(text),
        namesCurrency: /Toman/.test(text) || /US dollar/.test(text),
      };
    });
    chk("the breakdown card is on the page", card.hasCard);
    chk("...offering both scopes", card.bothScopes);
    chk("...and naming each currency, since there is more than one", card.namesCurrency);

    const empty = await page.evaluate(async () => {
      state = migrate(defaultState());
      state.profile.onboarded = true;
      save();
      go("finance");
      await new Promise((r) => setTimeout(r, 120));
      const text = document.querySelector("#view").textContent.replace(/\s+/g, " ");
      return { text, empty: Object.keys(spendByCategory("all")).length };
    });
    chk("with no entries at all there is nothing to bucket", empty.empty === 0, String(empty.empty));
    chk("...and the card says so instead of showing an empty chart",
      /Nothing spent/.test(empty.text), empty.text.slice(0, 120));

    await noOverflow(page, chk, "finance (empty)");
    await page.evaluate(async () => {
      const t = todayIso();
      ["Subscriptions", "Transport", "Bills", "Shopping", "Fun", "Education", "Food", "Health"]
        .forEach((c, i) => state.finance.entries.push({ id: uid(), date: addDays(t, -i),
          type: "expense", amount: 100 - i, cur: "USD", category: c, note: "" }));
      save(); go("finance");
      await new Promise((r) => setTimeout(r, 120));
    });
    await noOverflow(page, chk, "finance (full)");
  } finally {
    await browser.close();
  }
  return { pass: state.pass, fail: state.fail, errors };
}

module.exports = { run };
