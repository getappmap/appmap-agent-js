import { default as process, stderr } from "node:process";
import "./global.mjs";

const { reportError } = await import("../../dist/bundles/error.mjs");
import {
  persistExceptionQueue,
  recordException,
} from "../../dist/bundles/crash-reporter.mjs";

process.on("uncaughtExceptionMonitor", (error) => {
  recordException(error);
  persistExceptionQueue();
  stderr.write(reportError(error));
});
