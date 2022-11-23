const { process, URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

import { spawn as spawnChildProcess } from "child_process";

import { toAbsoluteUrl } from "../../url/index.mjs";

import { convertFileUrlToPath } from "../../path/index.mjs";

export const spawn = (exec, argv, options) =>
  spawnChildProcess(exec, argv, {
    ...options,
    cwd:
      "cwd" in options
        ? convertFileUrlToPath(toAbsoluteUrl(".", options.cwd))
        : process.cwd(),
  });
