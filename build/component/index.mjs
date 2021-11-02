import { writeEntryPointAsync } from "./static.mjs";

const automated_recorder_options = {
  blueprint: {
    emitter: ["remote-node-posix"],
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
    violation: ["exit"],
  },
};

writeEntryPointAsync("node", "boot", { blueprint: {} });
writeEntryPointAsync("node", "recorder-process", automated_recorder_options);
writeEntryPointAsync("node", "recorder-mocha", automated_recorder_options);
writeEntryPointAsync("node", "recorder-remote", automated_recorder_options);
writeEntryPointAsync("node", "recorder-manual", manual_recorder_options);
writeEntryPointAsync("node", "batch", other_options);
writeEntryPointAsync("node", "setup", other_options);
writeEntryPointAsync("node", "entry-validate-mocha", other_options);
