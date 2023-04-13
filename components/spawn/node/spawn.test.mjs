import process from "node:process";
import {
  assertDeepEqual,
  assertEqual,
  assertReject,
} from "../../__fixture__.mjs";
import { getCwdUrl } from "../../path/index.mjs";
import { killAllAsync, spawnAsync } from "./spawn.mjs";

const { Set } = globalThis;

const children = new Set();

assertDeepEqual(
  await spawnAsync(
    {
      exec: "node",
      argv: [
        "--eval",
        `
          process.stdout.write("foo");
          process.stderr.write("bar");
        `,
      ],
      options: { stdio: "pipe", cwd: getCwdUrl(process) },
    },
    children,
  ),
  { status: 0, signal: null, stdout: "foo", stderr: "bar" },
);

assertEqual(children.size, 0);

assertDeepEqual(
  await spawnAsync(
    {
      exec: "node",
      argv: ["--eval", `process.stderr.write("foo");`],
      options: { stdio: "ignore" },
    },
    children,
  ),
  { status: 0, signal: null, stdout: null, stderr: null },
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

assertDeepEqual(await promise, {
  status: null,
  signal: "SIGINT",
  stdout: null,
  stderr: null,
});
