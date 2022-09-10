
import { buildTestDependenciesAsync } from "../../build.mjs";
import Prompts from "./index.mjs";

globalThis.GLOBAL_PROMPTS = (prompt) => prompt;

const { prompts } = Prompts(await buildTestDependenciesAsync(import.meta.url));

prompts({});
