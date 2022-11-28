import process from "node:process";
import { spawn } from "child_process";

const { String, Error } = globalThis;

const child = spawn(
  "npx",
  [
    "jest",
    "--runInBand",
    "--testMatch",
    "**/*.mjs",
    "--",
    "components/recorder-jest/default/__fixture__.mjs",
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_OPTIONS: `--experimental-vm-modules ${
        process.env.NODE_OPTIONS || ""
      }`,
    },
  },
);

child.on("exit", (status, signal) => {
  if (status !== 0) {
    throw new Error(`Exit status ${String(status)}`);
  }
  if (signal !== null) {
    throw new Error(`Kill signal ${signal}`);
  }
});
