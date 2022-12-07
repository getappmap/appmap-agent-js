import { prompts } from "./index.mjs";

globalThis.GLOBAL_PROMPTS = (prompt) => prompt;

prompts({});
