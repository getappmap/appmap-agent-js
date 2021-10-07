import Boot from "../dist/node-boot.mjs";
import RecorderProcess from "../dist/node-recorder-process.mjs";

const { bootProcessRecorder } = Boot({ log: "info", violation: "exit" });
const configuration = bootProcessRecorder(process);
const { log } = configuration;
const { main } = RecorderProcess({ log });
main(process, configuration);
export * from "./loader.mjs";
