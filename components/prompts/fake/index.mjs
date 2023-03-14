import { readGlobal } from "../../global/index.mjs";

export const prompts = (prompt) => readGlobal("GLOBAL_PROMPTS")(prompt);
