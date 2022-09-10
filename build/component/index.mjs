const { Promise } = globalThis;

import { mkdir as mkdirAsync } from "fs/promises";
import { writeEntryPointAsync } from "./static.mjs";

const generateWriteAsync = (branch) => async (component, blueprint) => {
  await writeEntryPointAsync(branch, component, { blueprint });
};

const writeNodeAsync = generateWriteAsync("node");

const socket_emitter = { emitter: ["remote-socket"] };
const local_emitter = { emitter: ["local"] };

const exit_violation = { violation: ["exit"] };
const error_violation = { violation: ["error"] };

await mkdirAsync("dist/node");

await Promise.all([
  writeNodeAsync("configuration", error_violation),
  writeNodeAsync("configuration-environment", exit_violation),
  writeNodeAsync("configuration-process", exit_violation),
  writeNodeAsync("recorder-process", { ...socket_emitter, ...exit_violation }),
  writeNodeAsync("recorder-mocha", { ...socket_emitter, ...exit_violation }),
  writeNodeAsync("recorder-remote", { ...socket_emitter, ...exit_violation }),
  writeNodeAsync("recorder-api", { ...local_emitter, ...error_violation }),
  writeNodeAsync("batch", exit_violation),
  writeNodeAsync("setup", exit_violation),
  writeNodeAsync("validate-mocha", exit_violation),
  writeNodeAsync("init", exit_violation),
  writeNodeAsync("status", exit_violation),
]);
