const { process } = globalThis;

import { configuration, params } from "./__common__.mjs";

const { createMochaHooks } = await import(
  `../../components/recorder-mocha/index.mjs?${params.toString()}`
);

export const mochaHooks = createMochaHooks(process, configuration);
