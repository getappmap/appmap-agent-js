/* eslint-env node */

import { assertDeepEqual } from "../../__fixture__.mjs";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Spawn from "./index.mjs";

globalThis.GLOBAL_SPY_SPAWN = (exec, argv, options) => ({ exec, argv, options });
const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { spawn } = Spawn(dependencies);
assertDeepEqual(spawn("exec", ["argv0"], {}), {
  exec: "exec",
  argv: ["argv0"],
  options: {},
});
