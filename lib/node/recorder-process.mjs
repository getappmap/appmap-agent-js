import { configuration } from "./__common__.mjs";
import RecorderProcess from "../../dist/node/recorder-process.mjs";

const { log, socket } = configuration;
const { main } = RecorderProcess({ log, socket });
main(process, configuration);
export { transformSource, load } from "./__common__.mjs";
