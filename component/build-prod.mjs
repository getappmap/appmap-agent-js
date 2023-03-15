import { stdout } from "node:process";
import { home } from "./home.mjs";
import { bundleAsync } from "./bundle.mjs";

for (const [name, component, env, resolution] of [
  [
    "recorder-browser",
    "recorder-standalone",
    "browser",
    {
      emitter: "remote-socket",
    },
  ],
  [null, "error", "node", {}],
  [null, "server", "node", { validate: "ajv", source: "default" }],
  [null, "client", "node", { validate: "stub" }],
  [null, "init", "node", {}],
  [null, "status", "node", {}],
  [null, "setup", "node", { validate: "ajv" }],
  [null, "configuration-process", "node", { validate: "ajv" }],
  [null, "configuration-environment", "node", { validate: "stub" }],
  [
    null,
    "recorder-api",
    "node",
    {
      instrumentation: "default",
      source: "default",
      emitter: "local",
      validate: "ajv",
    },
  ],
  [
    "recorder-process",
    "recorder-cli",
    "node",
    {
      "recorder-cli": "process",
      instrumentation: "default",
      source: "default",
      emitter: "remote-socket",
      validate: "stub",
    },
  ],
  [
    "recorder-remote",
    "recorder-cli",
    "node",
    {
      "recorder-cli": "remote",
      instrumentation: "default",
      source: "default",
      emitter: "remote-socket",
      validate: "stub",
    },
  ],
  [
    "recorder-mocha",
    "recorder-cli",
    "node",
    {
      "recorder-cli": "mocha",
      instrumentation: "default",
      source: "default",
      emitter: "remote-socket",
      validate: "stub",
    },
  ],
  [
    "recorder-jest",
    "recorder-cli",
    "node",
    {
      "recorder-cli": "jest",
      // jest instrumentation happens on another process
      instrumentation: "dead",
      source: "dead",
      emitter: "remote-socket",
      validate: "stub",
    },
  ],
  [
    null,
    "transformer-jest",
    "node",
    {
      instrumentation: "default",
      source: "default",
      emitter: "remote-socket",
      validate: "stub",
    },
  ],
]) {
  stdout.write(`bundling ${component}...\n`);
  await bundleAsync(home, name ?? component, component, env, resolution);
}
