const { process, URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

import { spawn as spawnChildProcess } from "child_process";
const { convertFileUrlToPath } = await import(
  `../../path/index.mjs${__search}`
);

export const spawn = (exec, argv, options) =>
  spawnChildProcess(exec, argv, {
    ...options,
    cwd: "cwd" in options ? convertFileUrlToPath(options.cwd) : process.cwd(),
  });
