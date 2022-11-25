import { loadComponentAsync } from "../load.mjs";

const {
  process,
  process: { stderr },
} = globalThis;

const { reportError } = await loadComponentAsync("error", { env: "node" });

process.on("uncaughtExceptionMonitor", (error) => {
  stderr.write(reportError(error));
});
