import Boot from "../dist/node-boot.mjs";
import RecorderProcess from "../dist/node-recorder-process.mjs";

const { bootProcessRecorder } = Boot({log:"info"});
const configuration = bootProcessRecorder(process);
const {log} = configuration;
const {main} = RecorderProcess({
  emitter: "remote-node-tcp",
  log,
  violation: "exit",
});
main(process, configuration);
export * from "./loader.mjs";
