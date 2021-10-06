import { writeEntryPointAsync } from "./static.mjs";

writeEntryPointAsync("node", "boot");
writeEntryPointAsync("node", "recorder-process", {blueprint:{emitter:"node-tcp-remote"}});
writeEntryPointAsync("node", "recorder-mocha", {blueprint:{emitter:"node-tcp-remote"}});
writeEntryPointAsync("node", "recorder-remote", {blueprint:{emitter:"node-tcp-remote"}});
writeEntryPointAsync("node", "recorder-manual", {blueprint:{emitter:"local"}});
writeEntryPointAsync("node", "batch");
writeEntryPointAsync("node", "setup");
