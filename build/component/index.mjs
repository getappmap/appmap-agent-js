import { writeEntryPointAsync } from "./static.mjs";

const automated_recorder_options = {
  blueprint: {
    emitter: ["remote-node-tcp"],
    violation: ["exit"],
  },
};

const manual_recorder_options = {
  blueprint: {
    emitter: ["local"],
    violation: ["error"],
  },
};

const other_options = {
  blueprint: {
    violation: ["error"],
  },
};

writeEntryPointAsync("node", "boot");
writeEntryPointAsync("node", "recorder-process", automated_recorder_options);
writeEntryPointAsync("node", "recorder-mocha", automated_recorder_options);
writeEntryPointAsync("node", "recorder-remote", automated_recorder_options);
writeEntryPointAsync("node", "recorder-manual", manual_recorder_options);
writeEntryPointAsync("node", "batch", other_options);
writeEntryPointAsync("node", "setup", other_options);
