import { platform } from "node:process";
import { assertDeepEqual, assertReject } from "../../__fixture__.mjs";
import { spawnAsync } from "./index.mjs";

const { Set } = globalThis;

await assertReject(
  spawnAsync(
    {
      exec: "MISSING-EXECUTABLE",
      argv: [],
      options: {},
    },
    new Set(),
  ),
  platform === "win32"
    ? /^Error: Could not locate executable$/u
    : /^Error: spawn MISSING-EXECUTABLE ENOENT$/u,
);

assertDeepEqual(
  await spawnAsync(
    {
      exec: "node",
      argv: ["-e", "process.exit(123);"],
      options: { stdio: "ignore" },
    },
    new Set(),
  ),
  { signal: null, status: 123, stderr: null, stdout: null },
);
