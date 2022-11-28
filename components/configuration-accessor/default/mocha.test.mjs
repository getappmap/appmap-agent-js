import {
  assertThrow,
  assertDeepEqual,
  assertEqual,
} from "../../__fixture__.mjs";
import { fileURLToPath } from "node:url";
import {
  doesSupportSource,
  doesSupportTokens,
  hookCommandSource,
  hookCommandTokens,
  hookEnvironment,
} from "./mocha.mjs";

const base = "file:///A:/base/";
const recorder_path = fileURLToPath(
  "file:///A:/base/lib/node/recorder-mocha.mjs",
);
const loader_path = fileURLToPath(
  "file:///A:/base/lib/node/loader-standalone.mjs",
);

/////////////////
// unsupported //
/////////////////

// source //
assertEqual(doesSupportSource("node main.mjs"), false);
assertThrow(
  () => hookCommandSource("node main.mjs", "/bin/sh", base),
  /^ExternalAppmapError: Not a mocha command$/u,
);

// tokens //
assertEqual(doesSupportSource(["node", "main.mjs"]), false);
assertThrow(
  () => hookCommandTokens(["node", "main.mjs"], base),
  /^ExternalAppmapError: Not a parsed mocha command$/u,
);

//////////////////
// mocha --argv //
//////////////////

// source //
assertEqual(doesSupportSource("mocha --argv"), true);
assertDeepEqual(hookCommandSource("mocha --argv", "/bin/sh", base), [
  `mocha --require ${recorder_path} --argv`,
]);

// tokens //
assertEqual(doesSupportTokens(["mocha", "--argv"]), true);
assertDeepEqual(hookCommandTokens(["mocha", "--argv"], base), [
  "mocha",
  "--require",
  recorder_path,
  "--argv",
]);

//////////////////////
// npx mocha --argv //
//////////////////////

// source //
assertEqual(doesSupportSource("npx mocha --argv"), true);
assertDeepEqual(hookCommandSource("npx mocha --argv", "/bin/sh", base), [
  `npx mocha --require ${recorder_path} --argv`,
]);

// tokens //
assertEqual(doesSupportTokens(["npx", "mocha", "--argv"]), true);
assertDeepEqual(hookCommandTokens(["npx", "mocha", "--argv"], base), [
  "npx",
  "mocha",
  "--require",
  recorder_path,
  "--argv",
]);

//////////////////////////
// npm run mocha --argv //
//////////////////////////

// source //
assertEqual(doesSupportSource("npm exec mocha --argv"), true);
assertDeepEqual(hookCommandSource("npm exec mocha --argv", "/bin/sh", base), [
  `npm exec mocha --require ${recorder_path} --argv`,
]);

// tokens //
assertEqual(doesSupportTokens(["npm", "exec", "mocha", "--argv"]), true);
assertDeepEqual(hookCommandTokens(["npm", "exec", "mocha", "--argv"], base), [
  "npm",
  "exec",
  "mocha",
  "--require",
  recorder_path,
  "--argv",
]);

/////////////////////
// hookEnvironment //
/////////////////////

assertDeepEqual(
  hookEnvironment({ FOO: "bar", NODE_OPTIONS: "options" }, base),
  {
    FOO: "bar",
    NODE_OPTIONS: `options --experimental-loader=${loader_path}`,
  },
);
