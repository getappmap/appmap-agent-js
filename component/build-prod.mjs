import { home } from "./home.mjs";
import { bundleAsync } from "./bundle.mjs";

for (const [name, component, env, resolution] of [
  [null, "error", "node", {}],
  [null, "server", "node", {}],
  [null, "client", "node", {}],
  [null, "init", "node", {}],
  [null, "status", "node", {}],
  [null, "setup", "node", {}],
  [null, "configuration", "node", {}],
  [null, "configuration-process", "node", {}],
  [null, "configuration-environment", "node", {}],
  [null, "recorder-api", "node", { emitter: "local" }],
  [null, "recorder-cli", "node", { emitter: "remote-socket" }],
  [null, "transformer-jest", "node", { emitter: "remote-socket" }],
]) {
  await bundleAsync(home, name ?? component, component, env, resolution);
}
