import { pathToFileURL } from "url";
import { spawn } from "./index.mjs?env=test";

const { Promise, URL, process, Error, undefined } = globalThis;

for (const options of [{}, { cwd: new URL(pathToFileURL(process.cwd())) }]) {
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
