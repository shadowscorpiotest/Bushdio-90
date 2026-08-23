/* Runs a single suite in its own process. Kept separate from run.js so a suite that throws, hangs a
 * browser, or exits on its own cannot affect the others. */
const path = require("path");

const file = process.argv[2];
if (!file) { console.error("usage: _one.js <suite.test.js>"); process.exit(2); }

(async () => {
  let result;
  try {
    const suite = require(path.join(__dirname, file));
    if (typeof suite.run !== "function") throw new Error(`${file} does not export run()`);
    result = await suite.run();
  } catch (e) {
    console.log(`  FAIL ${file} threw before finishing — ${e && e.message}`);
    if (e && e.stack) console.log(String(e.stack).split("\n").slice(1, 4).join("\n"));
    process.exit(1);
  }
  const { pass = 0, fail = 0, errors = [] } = result || {};
  if (errors.length) {
    console.log(`\n  ${errors.length} console/page error(s):`);
    errors.forEach((x) => console.log("    " + x));
  }
  const bad = fail + errors.length;
  console.log(`\n  ${pass} passed, ${bad} failed`);
  process.exit(bad ? 1 : 0);
})();
