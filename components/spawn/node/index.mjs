const { process, URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

import { spawn as spawnChildProcess } from "child_process";
import { fileURLToPath } from "url";

export const spawn = (exec, argv, options) =>
  spawnChildProcess(exec, argv, {
    ...options,
    cwd: "cwd" in options ? fileURLToPath(options.cwd) : process.cwd(),
  });
