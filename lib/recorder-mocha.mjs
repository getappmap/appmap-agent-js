import Boot from "../dist/node-boot.mjs";
import RecorderMocha from "../dist/node-recorder-mocha.mjs";

const { bootMochaRecorder } = Boot({log:"info"});
const configuration = bootMochaRecorder(process);
const {log} = configuration;
const { createMochaHooks } = RecorderMocha({
  emitter: "remote-node-tcp",
  log,
  violation: "exit",
});
export const mochaHooks = createMochaHooks(process, configuration);
