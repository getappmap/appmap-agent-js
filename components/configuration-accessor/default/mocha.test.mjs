import { assertDeepEqual, assertEqual } from "../../__fixture__.mjs";
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
