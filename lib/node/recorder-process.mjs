import { configuration } from "./__common__.mjs";
import RecorderProcess from "../../dist/node/recorder-process.mjs";

const {
  process,
  JSON: { stringify: stringifyJSON },
} = globalThis;

const { log, socket } = configuration;
process.env.APPMAP_LOG_FILE = stringifyJSON(log.file);
const { main } = RecorderProcess({ log: log.level, socket });
main(process, configuration);
