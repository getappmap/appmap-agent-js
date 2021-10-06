import Boot from "../dist/node-boot.mjs";
import RecorderRemote from "../dist/node-recorder-remote.mjs";

const { bootRemoteRecorder } = Boot({ log: "info", violation: "exit" });
const configuration = bootRemoteRecorder(process);
const { log } = configuration;
const { main } = RecorderRemote({
  emitter: "remote-node-tcp",
  log,
  violation: "exit",
});
main(process, configuration);
export * from "./loader.mjs";
