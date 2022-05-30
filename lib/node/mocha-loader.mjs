import { configuration } from "./__common__.mjs";
import ValidateMocha from "../../dist/node/validate-mocha.mjs";
import Mocha from "mocha";
const { log } = configuration;
process.env.APPMAP_LOG_FILE = JSON.stringify(log.file);
const { validateMocha } = ValidateMocha({ log: log.level });
validateMocha(Mocha);

export { transformSource, load } from "./__common__.mjs";
