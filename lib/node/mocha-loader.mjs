import { configuration } from "./__common__.mjs";
import ValidateMocha from "../../dist/node/validate-mocha.mjs";
import Mocha from "mocha";
const { log } = configuration;

const {
  JSON: { stringify: stringifyJSON },
  process,
} = globalThis;

process.env.APPMAP_LOG_FILE = stringifyJSON(log.file);
const { validateMocha } = ValidateMocha({ log: log.level });
validateMocha(Mocha);
