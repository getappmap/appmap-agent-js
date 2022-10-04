import { assertDeepEqual } from "../../__fixture__.mjs";
import { spawn } from "./index.mjs?env=test";

globalThis.GLOBAL_SPY_SPAWN = (exec, argv, options) => ({
  exec,
  argv,
  options,
});

assertDeepEqual(spawn("exec", ["argv0"], {}), {
  exec: "exec",
  argv: ["argv0"],
  options: {},
});
