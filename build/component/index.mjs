import { writeEntryPointAsync } from "./static.mjs";

writeEntryPointAsync("node", "recorder-boot");
writeEntryPointAsync("node", "recorder-process");
writeEntryPointAsync("node", "recorder-mocha");
writeEntryPointAsync("node", "batch-boot");
writeEntryPointAsync("node", "batch");
