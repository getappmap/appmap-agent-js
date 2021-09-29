import { writeEntryPointAsync } from "./static.mjs";

writeEntryPointAsync("node", "boot");
writeEntryPointAsync("node", "recorder-process");
writeEntryPointAsync("node", "recorder-mocha");
writeEntryPointAsync("node", "recorder-manual");
writeEntryPointAsync("node", "recorder-empty");
writeEntryPointAsync("node", "batch");
