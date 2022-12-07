import { home } from "./home.mjs";
import { bundleAsync } from "./bundle.mjs";

for (const [entry, env, resolution] of [
  ["error", "node", {}],
  ["batch", "node", {}],
  ["validate-mocha", "node", {}],
  ["configuration", "node", {}],
  ["configuration-process", "node", {}],
  ["configuration-environment", "node", {}],
  ["recorder-api", "node", { emitter: "local" }],
  ["recorder-cli", "node", { emitter: "remote-socket" }],
]) {
  await bundleAsync(home, entry, env, resolution);
}
