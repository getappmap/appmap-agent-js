import Boot from "../dist/node-boot.mjs";
import RecorderRemote from "../dist/node-recorder-remote.mjs";

const { bootRemoteRecorder } = Boot({ log: "info", violation: "exit" });
const configuration = bootRemoteRecorder(process);
const { log } = configuration;
const { main } = RecorderRemote({ log });
main(process, configuration);
export * from "./loader.mjs";
