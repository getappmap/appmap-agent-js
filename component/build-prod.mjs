import { stdout } from "node:process";
import { home } from "./home.mjs";
import { bundleAsync } from "./bundle.mjs";

for (const [name, component, env, resolution] of [
  [null, "error", "node", {}],
  [null, "server", "node", { validate: "ajv" }],
  [null, "client", "node", { validate: "stub" }],
  [null, "init", "node", {}],
  [null, "status", "node", {}],
  [null, "setup", "node", { validate: "ajv" }],
  [null, "configuration-process", "node", { validate: "ajv" }],
  [null, "configuration-environment", "node", { validate: "stub" }],
  [null, "recorder-api", "node", { emitter: "local", validate: "ajv" }],
  [null, "recorder-cli", "node", { emitter: "remote-socket", validate: "stub" }],
  [null, "transformer-jest", "node", { emitter: "remote-socket", validate: "stub" }],
]) {
  stdout.write(`bundling ${component}...\n`);
  await bundleAsync(home, name ?? component, component, env, resolution);
}
