import { configuration } from "./__common__.mjs";
import RecorderMocha from "../../dist/node/recorder-mocha.mjs";
const { log } = configuration;
const { createMochaHooks } = RecorderMocha({ log });
export const mochaHooks = createMochaHooks(process, configuration);
