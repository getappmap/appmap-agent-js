#!/usr/bin/env node

const routes = new Map(
  [
    ["setup", "../lib/node/setup.mjs"],
    ["run", "../lib/node/batch.mjs"],
    ["version", "../lib/node/version.mjs"],
    ["help", "../lib/node/help.mjs"],
  ],
);

let route = "run";

if (routes.has(process.argv[2])) {
  route = process.argv[2];
  process.argv = [process.argv[0], process.argv[1], ...process.argv.slice(3)];
}

await import(routes.get(route));
