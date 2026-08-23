/* The migration ladder.
 *
 * This is the suite that protects real data. LifeHub keeps everything in one `localStorage` blob and
 * upgrades it through an ordered list of steps; a single careless step silently destroys weeks of
 * logging on every device that syncs. Several of these steps have already had to rescue data that a
 * naive rewrite would have dropped — a meal photographed but never ticked, a reflection written on a
 * day the journal also had text — so each of those rescues is asserted here by name.
 *
 * The core assertion is not "it did not crash". It is: take a save written by an OLD version, walk it
 * all the way up, and check the things a person would actually miss are still there.
 */
const { chromium } = require("playwright-core");
const { harness, open } = require("./_env.js");

/* A schema-20 save: before Learning was merged, before per-day meals, before study sessions, before
 * the journal absorbed reflections. It therefore exercises the five most destructive steps at once. */
const OLD_SAVE = {
  schema: 20,
  xp: 640,
  habits: [
    { id: "h1", name: "Morning meditation", emoji: "🧘", kind: "", type: "build", color: "#6a5ae0",
      cadence: { mode: "daily" }, goalIds: [], log: { "2026-06-01": { done: true }, "2026-06-02": { done: true, note: "hard today" } } },
  ],
  todos: [
    { id: "t1", text: "Pay yoga tuition", done: false, date: "2026-06-03", time: "", order: 1, habitId: "", supId: "", areaId: "finance" },
    { id: "t2", text: "Revise vectors", done: true, date: "2026-06-02", time: "", order: 2, habitId: "", supId: "", areaId: "skills" },
  ],
  /* the three study areas that schema 21 merged into `learning` */
  skills: { monthlyHours: 15, courses: [
    { id: "c1", name: "Linear Algebra", progress: 60, category: "Maths" },
    { id: "c2", name: "German", progress: 20, category: "Language" } ] },
  university: { weeklyHours: 25, tasks: [
    { id: "u1", title: "Problem set 4", course: "Linear Algebra", due: "2026-06-10", done: false } ] },
  work: { items: [{ id: "w1", title: "Polish resume", category: "Resume", due: "", done: true }] },
  study: { log: { "2026-06-01": { skills: 60, university: 30 } } },
  /* the fixed meal schedule that schema 25 turned into a library plus real days */
  nutrition: {
    goals: { kcal: 2000, protein: 140, carbs: 200, fats: 60, fiber: 25 },
    meals: [
      { id: "m1", slot: "Breakfast", name: "Oats", time: "08:00", kcal: 400, protein: 15, carbs: 60, fats: 12, fiber: 8 },
      { id: "m2", slot: "Lunch", name: "Chicken", time: "13:00", kcal: 600, protein: 45, carbs: 60, fats: 15, fiber: 6 },
      { id: "m3", slot: "Dinner", name: "Salmon", time: "19:00", kcal: 550, protein: 40, carbs: 40, fats: 20, fiber: 5 } ],
    log: { "2026-06-01": { m1: true, m2: true, m3: false } },
    photos: { "2026-06-01": { m1: [{ id: "ph1", kind: "image" }], m3: [{ id: "ph3", kind: "image" }] } },
    supplements: [{ id: "s1", name: "Vitamin D3", emoji: "☀️", dose: "1000 IU", every: "day" }],
    supTaken: {},
  },
  /* the two stores schema 26 merged */
  reflections: { "2026-06-01": "Only a reflection.", "2026-06-02": "Written on the dashboard." },
  journal: [{ id: "j2", date: "2026-06-02", text: "Written in the journal.", mood: "", tags: ["Happy"] }],
  memories: [{ id: "mem1", title: "Beach trip", date: "2026-05-20", note: "warm", emoji: "🏖️", photos: [], tags: ["summer"] }],
  reading: { yearlyGoal: 12, log: { "2026-06-01": 20 }, books: [
    { id: "b1", title: "Deep Work", author: "Cal Newport", pages: 296, page: 40, status: "current", rating: 0, recommenders: [] } ] },
  workout: { weeklyGoal: 5, plan: [], classes: [], skills: [],
    log: { "2026-06-02": [{ id: "sess1" }] },
    sessions: [{ id: "sess1", date: "2026-06-02", category: "Strength", exercises: [
      { id: "e1", name: "Squat", kind: "reps", sets: [{ id: "st1", reps: 5, weight: 80 }] } ] }] },
  finance: { entries: [{ id: "f1", date: "2026-06-01", type: "expense", amount: 68, category: "Food", note: "Groceries" }], importedClasses: [] },
  social: { items: [], log: {}, people: [{ id: "p1", name: "Sara", emoji: "", relation: "friend", birthday: "", note: "", tags: [], touches: [] }] },
  goals: [{ id: "g1", title: "Lose 8 kg", emoji: "🎯", type: "outcome", unit: "kg", direction: "down",
    start: 88, target: 80, deadline: "2026-12-01", note: "", priority: "high", status: "active",
    progress: [{ date: "2026-06-01", value: 86 }], habitIds: [], milestones: [] }],
};

async function run() {
  const { state, chk, section } = harness("migrations");
  const { browser, page, errors } = await open(chromium);
  try {
    const CUR = await page.evaluate(() => SCHEMA);

    section("A schema-20 save walks all the way up");
    const r = await page.evaluate((old) => {
      const a = migrate(JSON.parse(JSON.stringify(old)));
      const again = migrate(JSON.parse(JSON.stringify(a)));
      const prev = state;
      state = a;
      const out = {
        schema: a.schema,
        idempotent: JSON.stringify(a) === JSON.stringify(again),

        /* --- schema 21: three study areas merged into one --- */
        courses: a.learning.courses.map((c) => c.name).sort(),
        courseProgress: a.learning.courses.map((c) => c.progress).sort((x, y) => x - y),
        learnTasks: a.learning.tasks.map((k) => k.title).sort(),
        oldStudyStoresGone: [a.skills, a.university, a.work].every((x) => x === undefined),
        remappedAreaIds: a.todos.map((t) => t.areaId).sort(),
        quickStudyKept: a.study.log["2026-06-01"],

        /* --- schema 25: one meal schedule became a library plus real days --- */
        library: a.nutrition.library.map((m) => m.name).sort(),
        dayMeals: (a.nutrition.days["2026-06-01"] || { meals: [] }).meals.length,
        eaten: mealsOn("2026-06-01").filter((m) => m.eaten).map((m) => m.name).sort(),
        photoRescued: mealsOn("2026-06-01").filter((m) => !m.eaten).map((m) => m.name),
        kcal: nutritionOn("2026-06-01").kcal,
        photoBlobIds: Object.values(a.nutrition.photos["2026-06-01"]).map((v) => v[0].id).sort(),
        photoCount: Object.keys(a.nutrition.photos["2026-06-01"]).length,
        mealStoresGone: [a.nutrition.meals, a.nutrition.log].every((x) => x === undefined),
        standingGoals: a.nutrition.goals.kcal,

        /* --- schema 26: reflections folded into the journal --- */
        reflOnly: (a.journal.find((j) => j.date === "2026-06-01") || {}).text,
        bothKept: (a.journal.find((j) => j.date === "2026-06-02") || {}).text,
        journalTags: (a.journal.find((j) => j.date === "2026-06-02") || {}).tags,
        reflectionsGone: a.reflections === undefined,

        /* --- everything else must simply survive --- */
        habitLog: a.habits[0].log,
        habitNote: (a.habits[0].log["2026-06-02"] || {}).note,
        todoTexts: a.todos.map((t) => t.text).sort(),
        memory: a.memories[0].title,
        memoryTags: a.memories[0].tags,
        book: a.reading.books[0].page,
        readingLog: a.reading.log["2026-06-01"],
        workoutSets: a.workout.sessions[0].exercises[0].sets[0],
        finance: a.finance.entries[0].amount,
        person: a.social.people[0].name,
        goalProgress: a.goals[0].progress,
        xp: a.xp,
      };
      state = prev;
      return out;
    }, OLD_SAVE);

    chk("reaches the current schema", r.schema === CUR, `got ${r.schema}, current is ${CUR}`);
    chk("running it twice changes nothing", r.idempotent);

    section("Schema 21 — Skills, University and Work Prep became Learning");
    chk("both courses survive", r.courses.join() === "German,Linear Algebra", r.courses.join());
    chk("...with their progress", r.courseProgress.join() === "20,60", r.courseProgress.join());
    chk("the coursework and career items survive",
      r.learnTasks.join() === "Polish resume,Problem set 4", r.learnTasks.join());
    chk("the retired stores are gone", r.oldStudyStoresGone);
    chk("tasks pointing at the old areas are remapped",
      r.remappedAreaIds.join() === "finance,learning", r.remappedAreaIds.join());
    chk("the study ledger keeps its minutes",
      r.quickStudyKept && r.quickStudyKept.skills === 60 && r.quickStudyKept.university === 30,
      JSON.stringify(r.quickStudyKept));

    section("Schema 25 — one meal schedule became a library plus real days");
    chk("the schedule becomes the library, whole",
      r.library.join() === "Chicken,Oats,Salmon", r.library.join());
    chk("a logged day becomes a real day carrying real meals", r.dayMeals === 3, String(r.dayMeals));
    chk("...remembering which were eaten", r.eaten.join() === "Chicken,Oats", r.eaten.join());
    chk("a meal never ticked but HOLDING A PHOTO is rescued, marked not eaten",
      r.photoRescued.join() === "Salmon", r.photoRescued.join());
    chk("the day's calories match what the old code displayed", r.kcal === 1000, String(r.kcal));
    chk("both photos survive, re-keyed to their new meal", r.photoCount === 2, String(r.photoCount));
    chk("...and the blobs themselves are untouched",
      r.photoBlobIds.join() === "ph1,ph3", r.photoBlobIds.join());
    chk("the retired meal stores are gone", r.mealStoresGone);
    chk("standing nutrition goals survive", r.standingGoals === 2000, String(r.standingGoals));

    section("Schema 26 — reflections folded into the journal");
    chk("a reflection with no journal entry becomes one",
      r.reflOnly === "Only a reflection.", r.reflOnly);
    chk("a day with BOTH keeps both",
      r.bothKept.includes("Written in the journal.") && r.bothKept.includes("Written on the dashboard."),
      r.bothKept);
    chk("...and the entry keeps its tags", (r.journalTags || []).join() === "Happy", String(r.journalTags));
    chk("the reflections store is gone", r.reflectionsGone);

    section("Everything else survives untouched");
    chk("habit history is intact", Object.keys(r.habitLog).join() === "2026-06-01,2026-06-02");
    chk("...including a note written on a day", r.habitNote === "hard today", r.habitNote);
    chk("tasks survive", r.todoTexts.join() === "Pay yoga tuition,Revise vectors", r.todoTexts.join());
    chk("a memory survives with its tags", r.memory === "Beach trip" && (r.memoryTags || []).join() === "summer");
    chk("book progress survives", r.book === 40, String(r.book));
    chk("pages read survive", r.readingLog === 20, String(r.readingLog));
    chk("workout sets survive with their numbers",
      r.workoutSets && r.workoutSets.reps === 5 && r.workoutSets.weight === 80, JSON.stringify(r.workoutSets));
    chk("a finance entry survives", r.finance === 68, String(r.finance));
    chk("a person survives", r.person === "Sara", r.person);
    chk("goal progress survives", (r.goalProgress || []).length === 1 && r.goalProgress[0].value === 86);
    chk("XP survives", r.xp === 640, String(r.xp));

    section("Refusals and guards");
    const guards = await page.evaluate(() => {
      let tooNew = "";
      try { migrate({ schema: 9999 }); } catch (e) { tooNew = e.code || e.message; }
      /* an unversioned blob from before the ladder existed is treated as step 0, not rejected */
      let legacy = null;
      try { legacy = migrate({ habits: [], todos: [] }).schema; } catch (e) { legacy = "threw: " + e.message; }
      /* a fresh install lands on the current schema */
      const fresh = migrate(defaultState()).schema;
      return { tooNew, legacy, fresh, cur: SCHEMA };
    });
    chk("a save from a NEWER LifeHub is refused, not mangled",
      guards.tooNew === "schema-too-new", String(guards.tooNew));
    chk("an unversioned legacy blob is upgraded, not rejected",
      guards.legacy === guards.cur, String(guards.legacy));
    chk("a fresh state is already current", guards.fresh === guards.cur, String(guards.fresh));

    section("The ladder is well-formed");
    const shape = await page.evaluate(() => ({
      steps: MIGRATIONS.length, cur: SCHEMA,
      allFns: MIGRATIONS.every((f) => typeof f === "function"),
    }));
    chk("there is exactly one step per schema version",
      shape.steps === shape.cur, `${shape.steps} steps for schema ${shape.cur}`);
    chk("every step is callable", shape.allFns);
  } finally {
    await browser.close();
  }
  return { pass: state.pass, fail: state.fail, errors };
}

module.exports = { run };
