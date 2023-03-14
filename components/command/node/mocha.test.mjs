import { fileURLToPath } from "node:url";
import { assertDeepEqual, assertEqual } from "../../__fixture__.mjs";
import { doesSupport, hookCommandAsync, hookEnvironment } from "./mocha.mjs";

const self = "file:///A:/self/";
const base = "file:///A:/base/";
const hook_path = fileURLToPath("file:///A:/self/lib/node/mocha-hook.mjs");
const recorder_url = "file:///A:/self/lib/node/recorder.mjs";

//////////////////
// mocha --argv //
//////////////////

assertEqual(doesSupport(["mocha", "--argv"]), true);
assertDeepEqual(await hookCommandAsync(["mocha", "--argv"], self, base), [
  "mocha",
  "--require",
  hook_path,
  "--argv",
]);

/////////////////////
// hookEnvironment //
/////////////////////

assertDeepEqual(
  hookEnvironment({ FOO: "bar", NODE_OPTIONS: "options" }, self, base),
  {
    FOO: "bar",
    NODE_OPTIONS: `options --experimental-loader=${recorder_url}`,
  },
);
