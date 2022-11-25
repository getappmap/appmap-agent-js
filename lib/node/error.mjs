const {
  process,
  process: { stderr },
} = globalThis;

import { loadComponentAsync } from "../load.mjs";

const { reportError } = await loadComponentAsync("error", { env: "node" });

process.on("uncaughtExceptionMonitor", (error) => {
  stderr.write(reportError(error));
});
