import {spawn} from "child_process";

export const spawnAsync = (exec, argv, options) => new Promise((resolve, reject) => {
  const child = spawn(exec, argv, options);
  child.on("exit", (status, signal) => {
    resolve({ signal, status });
  });
  child.on("error", reject);
});
