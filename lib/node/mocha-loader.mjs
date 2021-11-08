import { configuration } from "./__common__.mjs";
const { log } = configuration;
import ValidateMocha from "../../dist/node/validate-mocha.mjs";
import Mocha from "mocha";
const { validateMocha } = ValidateMocha({ log });
validateMocha(Mocha);

export { transformSource, load } from "./__common__.mjs";
