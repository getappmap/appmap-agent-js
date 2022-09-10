import { configuration } from "./__common__.mjs";
import RecorderRemote from "../../dist/node/recorder-remote.mjs";

const {
  process,
  JSON:{stringify:stringifyJSON},
} = globalThis;

const { log, socket } = configuration;
process.env.APPMAP_LOG_FILE = stringifyJSON(log.file);
const { main } = RecorderRemote({ log: log.level, socket });
main(process, configuration);
export { transformSource, load } from "./__common__.mjs";
