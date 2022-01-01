import { configuration } from "./__common__.mjs";
import RecorderMocha from "../../dist/node/recorder-mocha.mjs";
const { log , socket } = configuration;
const { createMochaHooks } = RecorderMocha({ log , socket });
export const mochaHooks = createMochaHooks(process, configuration);
