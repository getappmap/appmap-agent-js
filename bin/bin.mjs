#!/usr/bin/env node

const methods = ["setup", "batch"];

let method = "batch";

if (methods.includes(process.argv[2])) {
  method = process.argv[2];
  process.argv = [process.argv[0], process.argv[1], ...process.argv.slice(3)];
}

if (method === "batch") {
  import("../lib/node/batch.mjs");
} else if (method === "setup") {
  import("../lib/node/setup.mjs");
} else {
  throw new Error("This should never happen");
}
