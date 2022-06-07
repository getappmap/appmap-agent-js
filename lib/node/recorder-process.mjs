import { configuration } from "./__common__.mjs";
import RecorderProcess from "../../dist/node/recorder-process.mjs";

const { log, socket } = configuration;
process.env.APPMAP_LOG_FILE = JSON.stringify(log.file);
const { main } = RecorderProcess({ log: log.level, socket });
main(process, configuration);
export { transformSource, load } from "./__common__.mjs";
