const { process } = globalThis;

import { configuration, params } from "./configuration.mjs";

const { createMochaHooks } = await import(
  `../../components/recorder-mocha/index.mjs?${params.toString()}`
);

export const mochaHooks = createMochaHooks(process, configuration);
