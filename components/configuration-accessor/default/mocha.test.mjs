import { assertDeepEqual, assertEqual } from "../../__fixture__.mjs";
import { fileURLToPath } from "node:url";
import {
  doesSupportSource,
  doesSupportTokens,
  hookCommandSourceAsync,
  hookCommandTokensAsync,
  hookEnvironment,
} from "./mocha.mjs";

const base = "file:///A:/base/";
const hook_path = fileURLToPath("file:///A:/base/lib/node/mocha-hook.mjs");
const recorder_url = "file:///A:/base/lib/node/recorder.mjs";

//////////////////
// mocha --argv //
//////////////////

// source //
assertEqual(doesSupportSource("mocha --argv", "/bin/sh"), true);
assertDeepEqual(await hookCommandSourceAsync("mocha --argv", "/bin/sh", base), [
  `mocha --require ${hook_path.replace(/\\/gu, "\\\\")} --argv`,
]);

// tokens //
assertEqual(doesSupportTokens(["mocha", "--argv"]), true);
assertDeepEqual(await hookCommandTokensAsync(["mocha", "--argv"], base), [
  "mocha",
  "--require",
  hook_path,
  "--argv",
]);

/////////////////////
// hookEnvironment //
/////////////////////

assertDeepEqual(
  hookEnvironment({ FOO: "bar", NODE_OPTIONS: "options" }, base),
  {
    FOO: "bar",
    NODE_OPTIONS: `options --experimental-loader=${recorder_url}`,
  },
);
