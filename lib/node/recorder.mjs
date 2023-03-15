import "./error.mjs";
import { configuration } from "./configuration.mjs";
export * from "./loader-esm.mjs";

// Use top-level await to wait for ./configuration.mjs to update env variables.
const { record } = await import(
  `../../dist/bundles/recorder-${configuration.recorder}.mjs`
);

record(configuration);
