const { process } = globalThis;

import Mocha from "mocha";
import "./error.mjs";
import { configuration, params } from "./configuration.mjs";
const { validateMocha } = await import(
  `../../components/validate-mocha/index.mjs?${params.toString()}`
);

validateMocha(Mocha);

const { createMochaHooks } = await import(
  `../../components/recorder-mocha/index.mjs?${params.toString()}`
);

export const mochaHooks = createMochaHooks(process, configuration);
