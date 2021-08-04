import { spawn } from "child_process";

const _Promise = Promise;

export default (dependencies) => {
  return {
    spawnAsync: (exec, argv, options) =>
      new _Promise((resolve, reject) => {
        const child = spawn(exec, argv, options);
        child.on("exit", (status, signal) => {
          resolve({ signal, status });
        });
        child.on("error", reject);
      }),
  };
};
