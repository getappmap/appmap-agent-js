import Mocha from "mocha";
import "./error.mjs";
import { loadComponentAsync } from "../load.mjs";
import { configuration, params } from "./configuration.mjs";

const { process } = globalThis;
const { validateMocha } = await loadComponentAsync("validate-mocha", params);

validateMocha(Mocha);

const { createMochaHooks } = await loadComponentAsync("recorder-mocha", params);

export const mochaHooks = createMochaHooks(process, configuration);
