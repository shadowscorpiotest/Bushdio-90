/* The day on screen is the day you write to.
 *
 * Every page that can look at a past day carries a cursor — dayCursor("dashboard"),
 * dayCursor("health") and so on. The rule is that a handler writes to THAT day, never to today.
 *
 * This has been broken five separate times, in five different features: the study log, the meal
 * tick, the meal photo, two reflection boxes, the course quick-log, and the task reorder arrows.
 * It is worth understanding why it keeps coming back and why it is so easy to miss.
 *
 * The failure is almost always SILENT. A handler that reads todayIso() looks up a record by id in
 * the wrong day's list, does not find it, and returns. No error, no toast, nothing in the console —
 * the button simply does nothing, and you conclude you mis-tapped. The other half of the time it
 * succeeds against the wrong day, which is worse: your Tuesday minutes quietly land on Thursday.
 *
 * So each check below asserts BOTH halves — that the day you were looking at changed, and that
 * today did not. Asserting only the first would pass against code that writes to both.
 */
const { chromium } = require("playwright-core");
const { harness, open, ROOT } = require("./_env.js");
const fs = require("fs");
const path = require("path");

/* Helpers whose whole job is "the records for one day". Passing todayIso() into one of these from a
 * handler is the bug, spelled out literally. Named exceptions are listed with the assertion. */
const DAY_SCOPED = [
  "mealsOn", "tasksOn", "studySessionsOn", "ensureDay", "dayEntry", "dayGoals", "hasDayGoals",
  "studyOn", "studyMins", "sessionMinsOn", "focusTasks", "journalOn", "ensureJournalOn",
];

async function run() {
  const { state, chk, section } = harness("day-cursor");
  const { browser, page, errors } = await open(chromium);
  try {
    /* A fixed stage: an empty profile, one habit, one course, and the same meal on both days, so
     * "did the right day change" is answerable and "did it hit the wrong one" is detectable. */
    const setup = await page.evaluate(() => {
      state = migrate(defaultState());
      state.profile.onboarded = true;
      const past = addDays(todayIso(), -3);

      state.habits = [{ id: "h1", name: "Read", emoji: "📖", kind: "", type: "build",
        color: "", cadence: { mode: "daily" }, goalIds: [], groupId: "", order: 1,
        archived: false, archivedOn: "", log: {} }];

      state.learning.courses = [{ id: "c1", name: "German", emoji: "🇩🇪", kind: "skill",
        status: "active", progress: 0, note: "", books: [], created: past, updated: past }];

      /* the same meal, by name, on both days — a handler that ticks "the Oats" must tick the right
         one, and with only one day seeded it could not possibly get that wrong */
      [past, todayIso()].forEach((d) => {
        ensureDay(d).meals.push({ id: "meal-" + d, libId: "", slot: "Breakfast", name: "Oats",
          time: "08:00", kcal: 400, protein: 20, carbs: 50, fats: 10, fiber: 5, note: "",
          eaten: false });
      });
      save();
      return { past, today: todayIso() };
    });
    const { past, today } = setup;
    chk("the stage is set on a past day, not today", past < today, `${past} < ${today}`);

    /* ---------------------------------------------------------------- tasks */
    section("A task filed from a past day belongs to that day");
    const task = await page.evaluate(async (past) => {
      setCursor("dashboard", past);
      go("dashboard");
      SUBMITS["todo-add"]({ text: "Retro task", habitId: "", time: "" });
      save();
      const mine = state.todos.find((t) => t.text === "Retro task");
      return { date: mine && mine.date, onPast: tasksOn(past).length, onToday: tasksOn(todayIso()).length };
    }, past);
    chk("the new task carries the day on screen", task.date === past, String(task.date));
    chk("...it appears on that day", task.onPast === 1, String(task.onPast));
    chk("...and NOT on today", task.onToday === 0, String(task.onToday));

    section("Earlier / Later reorders the day the task is on");
    /* the arrows live in the task's own sheet, which opens from any day — this is the case that was
       a silent no-op, because the task was not in today's list at all */
    const reorder = await page.evaluate(async (past) => {
      addTaskOn("Second", past, {});
      addTaskOn("Third", past, {});
      save();
      const before = tasksOn(past).map((t) => t.text);
      ACTIONS["task-down"]({ dataset: { id: tasksOn(past)[0].id } });
      const after = tasksOn(past).map((t) => t.text);
      return { before, after };
    }, past);
    chk("the order on that day actually changes",
      reorder.before.join(">") !== reorder.after.join(">"),
      `${reorder.before.join(">")} → ${reorder.after.join(">")}`);
    chk("...and it is a swap of the first two, not a reshuffle",
      reorder.after[0] === reorder.before[1] && reorder.after[1] === reorder.before[0],
      reorder.after.join(">"));

    /* ---------------------------------------------------------------- habits */
    section("A habit ticked on a past day is ticked on that day");
    const habit = await page.evaluate(async (past) => {
      setCursor("habits", past);
      const xpBefore = state.xp;
      toggleHabit("h1");
      const h = state.habits[0];
      const retroXp = state.xp - xpBefore;

      setCursor("habits", todayIso());
      const xpMid = state.xp;
      toggleHabit("h1");
      return {
        pastMet: habitMet(h, past), todayMet: habitMet(h, todayIso()),
        retroXp, todayXp: state.xp - xpMid,
      };
    }, past);
    chk("that day is marked kept", habit.pastMet);
    chk("...and today is untouched by it", habit.todayMet === true, "today ticked separately");
    chk("retro-ticking earns no XP — the app must not pay for backfill", habit.retroXp === 0,
      String(habit.retroXp));
    chk("...while ticking today still does", habit.todayXp > 0, String(habit.todayXp));

    /* ---------------------------------------------------------------- meals */
    section("The meal you tick is the one on the day you are looking at");
    const meal = await page.evaluate(async (past) => {
      setCursor("health", past);
      /* Settle any daily mission first. render() claims completed missions and awards their XP, so a
       * mission falling due inside the measurement window would be counted as the meal's XP and this
       * assertion would fail for a reason that has nothing to do with meals. */
      checkMissions();
      const xpBefore = state.xp;
      ACTIONS["meal-toggle"]({ dataset: { id: "meal-" + past } });
      return {
        pastEaten: mealsOn(past)[0].eaten,
        todayEaten: mealsOn(todayIso())[0].eaten,
        xp: state.xp - xpBefore,
      };
    }, past);
    chk("the past day's meal is ticked", meal.pastEaten === true);
    chk("...and today's identically-named meal is NOT", meal.todayEaten === false);
    chk("no XP for a retro-logged meal", meal.xp === 0, String(meal.xp));

    section("A meal added from a past day lands on that day");
    const added = await page.evaluate(async (past) => {
      setCursor("health", past);
      SUBMITS["meal-add"]({ slot: "Lunch", name: "Soup", time: "13:00", kcal: "300",
        protein: "10", carbs: "30", fats: "5", fiber: "2", note: "", keep: "" });
      save();
      return { past: mealsOn(past).map((m) => m.name), today: mealsOn(todayIso()).map((m) => m.name) };
    }, past);
    chk("it is on the day on screen", added.past.includes("Soup"), added.past.join(","));
    chk("...and not on today", !added.today.includes("Soup"), added.today.join(","));

    section("Calorie goals set for one day do not become today's goals");
    const goals = await page.evaluate(async (past) => {
      setCursor("health", past);
      SUBMITS["day-goals"]({ kcal: "1800", protein: "120", carbs: "180", fats: "60", fiber: "25" });
      save();
      return {
        pastKcal: dayGoals(past).kcal, todayKcal: dayGoals(todayIso()).kcal,
        standing: state.nutrition.goals.kcal, pastOverridden: hasDayGoals(past),
        todayOverridden: hasDayGoals(todayIso()),
      };
    }, past);
    chk("that day gets its own target", goals.pastKcal === 1800 && goals.pastOverridden,
      String(goals.pastKcal));
    chk("today still reads the standing target", goals.todayKcal === goals.standing,
      `${goals.todayKcal} vs ${goals.standing}`);
    chk("...and today was given no override at all", goals.todayOverridden === false);

    /* ---------------------------------------------------------------- study */
    section("The course quick-log offers the day Learning is showing");
    /* this one is asserted through the DOM, because the bug was in the form's DEFAULT VALUE — the
       submit handler was always willing to accept the right date, it was simply never offered one */
    const quicklog = await page.evaluate(async (past) => {
      setCursor("learning", past);
      go("learning");
      ACTIONS["course-study"]({ dataset: { id: "c1" } });
      await new Promise((r) => setTimeout(r, 60));
      const input = document.querySelector('form[data-submit="course-study"] input[name="date"]');
      const title = (document.querySelector(".modal-head h3") || {}).textContent || "";
      const v = input ? input.value : "(no date field)";
      closeModal();
      return { v, title: title.trim() };
    }, past);
    chk("the date field is pre-filled with that day, not today", quicklog.v === past,
      `${quicklog.v} (wanted ${past})`);
    /* filing under a day you are not looking at should never be silent — the heading names the day */
    chk("...and the heading names the day it will file under",
      /\b\d{1,2}\b/.test(quicklog.title) && quicklog.title.includes("German"), quicklog.title);

    section("Study minutes land on the day they are logged for");
    const study = await page.evaluate(async (past) => {
      setCursor("learning", past);
      const beforePast = studyMins(past), beforeToday = studyMins(todayIso());
      SUBMITS["study-add"]({ mins: "50", date: past, kind: "vocabulary", courseId: "c1",
        note: "", resource: "", resourceType: "", chapter: "", pages: "" });
      save();
      return {
        past: studyMins(past) - beforePast,
        today: studyMins(todayIso()) - beforeToday,
        sessionDate: (studySessions()[0] || {}).date,
      };
    }, past);
    chk("the minutes appear on that day", study.past === 50, String(study.past));
    chk("...and today gains nothing", study.today === 0, String(study.today));
    chk("the session itself is dated that day", study.sessionDate === past, String(study.sessionDate));

    /* the month total used to walk only state.study.log, so a day whose ONLY record was a session
       read as zero hours even while the day card showed the minutes */
    const month = await page.evaluate(() => studyDays().length);
    chk("a day known only through a session still counts as a study day", month >= 1, String(month));

    /* ---------------------------------------------------------------- writing */
    section("What you write about a day is filed under that day");
    const wrote = await page.evaluate(async (past) => {
      const xpBefore = state.xp;
      CHANGES["reflection"]({ value: "A retro note.", dataset: { date: past } });
      const retroXp = state.xp - xpBefore;
      const xpMid = state.xp;
      CHANGES["reflection"]({ value: "Today's note.", dataset: { date: todayIso() } });
      return {
        past: (journalOn(past) || {}).text,
        today: (journalOn(todayIso()) || {}).text,
        retroXp, todayXp: state.xp - xpMid,
      };
    }, past);
    chk("the past day holds what was written about it", wrote.past === "A retro note.", String(wrote.past));
    chk("...and today holds its own", wrote.today === "Today's note.", String(wrote.today));
    chk("no XP for writing about an old day", wrote.retroXp === 0, String(wrote.retroXp));
    chk("...while today's first entry still earns it", wrote.todayXp > 0, String(wrote.todayXp));

    /* ------------------------------------------------- the standing guard */
    section("No handler reaches for today when it should read the cursor");
    /* A source scan, deliberately narrow: it looks only for a day-scoped helper called with the
     * literal todayIso(). That is the exact shape of every instance of this bug, and it is specific
     * enough not to fire on the many legitimate `d === todayIso()` comparisons.
     *
     * Comments are stripped first. An earlier version of a check like this matched the word it was
     * looking for inside a comment explaining the rule, which is a good way to lose faith in a test.
     */
    const src = fs.readFileSync(path.join(ROOT, "app.js"), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(?<![:"'`\\])\/\/.*$/gm, "");
    const re = new RegExp(`\\b(${DAY_SCOPED.join("|")})\\s*\\(\\s*todayIso\\(\\)`, "g");
    const hits = [...src.matchAll(re)].map((m) => {
      const line = src.slice(0, m.index).split("\n").length;
      return { fn: m[1], text: src.split("\n")[line - 1].trim().slice(0, 90) };
    });

    /* The only permitted uses are wrappers whose NAME promises today. They exist so a caller that
     * genuinely means "today" says so out loud instead of hardcoding it at the call site. */
    const NAMED_TODAY = ["studyMinutesToday", "journalToday", "hardTask"];
    const unexpected = hits.filter((h) => !NAMED_TODAY.some((n) => h.text.includes(n)));
    chk("every day-scoped read with a hardcoded today is a wrapper that says 'today' in its name",
      unexpected.length === 0,
      unexpected.map((h) => h.text).join(" | ") || `${hits.length} allowed`);
    chk("...and those wrappers are still there, so this guard is testing something",
      hits.length === NAMED_TODAY.length, `${hits.length} of ${NAMED_TODAY.length}`);

    /* There is no automated check here for dead handlers, and that is deliberate. Two attempts at
     * one — matching data-action="…" in the source, then counting each key's occurrences — both
     * produced dozens of false positives, because actions are emitted through helpers (addBtn),
     * built from variables, and because naively stripping /*…*\/ comments over-matches on the many
     * strings in this file that contain those characters. A guard I cannot trust is worse than
     * none: it would be silenced with an allowlist within a week. Dead handlers get found by
     * reading the code, as ag-meal and class-undo both were. */
  } finally {
    await browser.close();
  }
  return { pass: state.pass, fail: state.fail, errors };
}

module.exports = { run };
