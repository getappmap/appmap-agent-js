import { spawn } from "child_process";
import { fileURLToPath } from "url";

const { process } = globalThis;

export default (_dependencies) => ({
  spawn: (exec, argv, options) =>
    spawn(exec, argv, {
      ...options,
      cwd: "cwd" in options ? fileURLToPath(options.cwd) : process.cwd(),
    }),
});
