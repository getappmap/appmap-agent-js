import { assertDeepEqual, assertEqual } from "../../__fixture__.mjs";
import { fileURLToPath } from "node:url";
import { doesSupport, hookCommandAsync, hookEnvironment } from "./mocha.mjs";

const base = "file:///A:/base/";
const hook_path = fileURLToPath("file:///A:/base/lib/node/mocha-hook.mjs");
const recorder_url = "file:///A:/base/lib/node/recorder.mjs";

//////////////////
// mocha --argv //
//////////////////

assertEqual(doesSupport(["mocha", "--argv"]), true);
assertDeepEqual(await hookCommandAsync(["mocha", "--argv"], base), [
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
