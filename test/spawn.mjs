import { spawn } from "child_process";

const { Promise, Error } = globalThis;

export const spawnAsync = (exec, argv, options) =>
  new Promise((resolve, reject) => {
    const child = spawn(exec, argv, options);
    child.on("exit", (status, signal) => {
      resolve({ signal, status });
    });
    child.on("error", reject);
  });

export const spawnStrictAsync = async (exec, argv, options) => {
  const { signal, status } = await spawnAsync(exec, argv, options);
  if (signal !== null) {
    throw new Error(`Kill signal: ${signal}`);
  }
  if (status !== 0) {
    throw new Error(`Exit code: ${status}`);
  }
};
