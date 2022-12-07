import "../../__fixture__.mjs";
import { getTmpUrl } from "../../path/index.mjs";
import { spawn } from "./index.mjs";

const { Promise, Error, undefined } = globalThis;

for (const options of [{}, { cwd: getTmpUrl() }]) {
  await new Promise((resolve, reject) => {
    const child = spawn("node", ["--version"], options);
    child.on("error", reject);
    child.on("exit", (status, signal) => {
      if (signal !== null) {
        reject(new Error("command signal"));
      } else if (status !== 0) {
        reject(new Error("command status"));
      } else {
        resolve(undefined);
      }
    });
  });
}
