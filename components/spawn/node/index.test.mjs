import { pathToFileURL } from "url";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Spawn from "./index.mjs";

export default (async () => {
  const dependencies = await buildTestDependenciesAsync(import.meta.url);
  const { spawn } = Spawn(dependencies);
  for (const options of [{}, { cwd: new URL(pathToFileURL(process.cwd())) }]) {
    await new Promise((resolve, reject) => {
      const child = spawn("echo", ["foo"], options);
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
})();
