#!/usr/bin/env node

import "../lib/batch.mjs";

const methods = ["setup", "batch"];

let method = "batch";

if (methods.includes(process.argv[1])) {
  method = process.argv[2];
  process.argv = [process.argv[0], process.argv[1], ...process.argv.slice(3)];
}

if (method === "batch") {
  import("../lib/batch.mjs");
} else if (method === "setup") {
  import("../lib/setup.mjs");
} else {
  throw new Error("This should never happen");
}
