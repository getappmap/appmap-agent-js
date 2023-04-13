import { default as process, stderr } from "node:process";
import "./global.mjs";

const { reportError } = await import("../../dist/bundles/error.mjs");

process.on("uncaughtExceptionMonitor", (error) => {
  stderr.write(reportError(error));
});
