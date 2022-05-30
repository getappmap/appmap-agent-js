import { configuration } from "./__common__.mjs";
import RecorderMocha from "../../dist/node/recorder-mocha.mjs";
const { log, socket } = configuration;
process.env.APPMAP_LOG_FILE = JSON.stringify(log.file);
const { createMochaHooks } = RecorderMocha({ log: log.level, socket });
export const mochaHooks = createMochaHooks(process, configuration);
