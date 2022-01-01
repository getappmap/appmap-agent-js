import { configuration } from "./__common__.mjs";
import RecorderRemote from "../../dist/node/recorder-remote.mjs";

const { log, socket } = configuration;
const { main } = RecorderRemote({ log, socket });
main(process, configuration);
export { transformSource, load } from "./__common__.mjs";
