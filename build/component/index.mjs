
import { writeEntryPointAsync } from "./static.mjs";

const generateWriteAsync = (branch) => async (component, blueprint) => {
  await writeEntryPointAsync(branch, component, { blueprint });
};

const writeNodeAsync = generateWriteAsync("node");

const posix_emitter = { emitter: ["remote-node-posix"] };
const local_emitter = { emitter: ["local"] };

const exit_violation = { violation: ["exit"] };
const error_violation = { violation: ["error"] };

await Promise.all([
  writeNodeAsync("configuration", error_violation),
  writeNodeAsync("configuration-environment", exit_violation),
  writeNodeAsync("configuration-process", exit_violation),
  writeNodeAsync("recorder-process", { ...posix_emitter, ...exit_violation }),
  writeNodeAsync("recorder-mocha", { ...posix_emitter, ...exit_violation }),
  writeNodeAsync("recorder-remote", { ...posix_emitter, ...exit_violation }),
  writeNodeAsync("recorder-manual", { ...local_emitter, ...error_violation }),
  writeNodeAsync("batch", exit_violation),
  writeNodeAsync("setup", exit_violation),
  writeNodeAsync("validate-mocha", exit_violation),
  writeNodeAsync("loader", exit_violation),
]);
