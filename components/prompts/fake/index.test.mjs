import { prompts } from "./index.mjs?env=test";

globalThis.GLOBAL_PROMPTS = (prompt) => prompt;

prompts({});
