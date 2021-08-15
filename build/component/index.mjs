import { writeEntryPointAsync } from "./static.mjs";

writeEntryPointAsync("node", "recorder-boot");
writeEntryPointAsync("node", "configuration");
writeEntryPointAsync("node", "recorder-process");
writeEntryPointAsync("node", "recorder-mocha");
writeEntryPointAsync("node", "recorder-manual");
writeEntryPointAsync("node", "batch-boot");
writeEntryPointAsync("node", "batch");
