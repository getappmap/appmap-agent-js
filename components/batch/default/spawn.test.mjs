import {
  assertDeepEqual,
  assertEqual,
  assertReject,
} from "../../__fixture__.mjs";
import { killAllAsync, spawnAsync } from "./spawn.mjs";

const { Set } = globalThis;

const children = new Set();

assertDeepEqual(
  await spawnAsync(
    { exec: "node", argv: ["--eval", "123;"], options: { stdio: "inherit" } },
    children,
  ),
  { status: 0, signal: null },
);

assertEqual(children.size, 0);

await assertReject(
  spawnAsync(
    {
      exec: "ENOENT-EXEC",
      argv: ["--eval", "123;"],
      options: { stdio: "inherit" },
    },
    children,
  ),
  /^Error:.* ENOENT$/u,
);

assertEqual(children.size, 0);

const promise = spawnAsync(
  {
    exec: "node",
    argv: ["--eval", "setTimeout(() => {}, 3000);"],
    options: { stdio: "ignore" },
  },
  children,
);

await killAllAsync(children);

assertDeepEqual(await promise, { status: null, signal: "SIGINT" });
