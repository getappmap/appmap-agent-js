const {
  process,
  process: { stderr },
} = globalThis;

import { reportError } from "../../components/error/index.mjs?env=node";

process.on("uncaughtExceptionMonitor", (error) => {
  stderr.write(reportError(error));
});
