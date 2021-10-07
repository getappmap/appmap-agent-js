import Boot from "../dist/node-boot.mjs";
import RecorderMocha from "../dist/node-recorder-mocha.mjs";

const { bootMochaRecorder } = Boot({
  log: "info",
  violation: "exit",
});
const configuration = bootMochaRecorder(process);
const { log } = configuration;
const { createMochaHooks } = RecorderMocha({ log });
export const mochaHooks = createMochaHooks(process, configuration);
