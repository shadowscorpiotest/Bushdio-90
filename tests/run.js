#!/usr/bin/env node
/* Runs every *.test.js in this folder and exits non-zero if any assertion failed.
 *
 * Each suite exports `async run()` returning {pass, fail, errors}. Suites run in separate processes
 * so one crash cannot take the rest down and so a leaked browser cannot poison the next suite.
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { EXEC, SEARCHED } = require("./_env.js");

if (!EXEC) {
  console.error(
    "\nNo Chromium found. Looked in:\n" +
    SEARCHED.map((s) => "    " + s).join("\n") +
    "\n\nInstall one:\n" +
    "    npx playwright-core install chromium\n" +
    "  or point at an existing binary:\n" +
    "    LIFEHUB_CHROME=/path/to/chrome npm test\n"
  );
  process.exit(1);
}

const only = process.argv.slice(2).filter((a) => !a.startsWith("-"));
const files = fs.readdirSync(__dirname)
  .filter((f) => f.endsWith(".test.js"))
  .filter((f) => !only.length || only.some((o) => f.includes(o)))
  .sort();

if (!files.length) { console.error("No test files matched."); process.exit(1); }

console.log(`LifeHub — ${files.length} suite${files.length === 1 ? "" : "s"}\nbrowser: ${EXEC}`);

let pass = 0, fail = 0;
const failed = [];
for (const f of files) {
  console.log(`\n${"=".repeat(60)}\n${f}\n${"=".repeat(60)}`);
  const r = spawnSync(process.execPath, [path.join(__dirname, "_one.js"), f], { stdio: "inherit" });
  /* the child prints its own tally; the exit code carries the verdict, and any non-zero exit —
     including a crash before a single assertion ran — counts as a failure rather than a skip */
  if (r.status === 0) { pass++; } else { fail++; failed.push(f); }
}

console.log(`\n${"=".repeat(60)}`);
if (fail) {
  console.log(`${fail} suite${fail === 1 ? "" : "s"} FAILED: ${failed.join(", ")}`);
  console.log(`${pass} passed`);
  process.exit(1);
}
console.log(`all ${pass} suite${pass === 1 ? "" : "s"} passed`);
