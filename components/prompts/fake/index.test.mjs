/* global global */
import { buildTestDependenciesAsync } from "../../build.mjs";
import Prompts from "./index.mjs";

global.GLOBAL_PROMPTS = (prompt) => prompt;

const { prompts } = Prompts(await buildTestDependenciesAsync(import.meta.url));

prompts({});
