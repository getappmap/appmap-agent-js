import { defineGlobal } from "../../global/index.mjs";
import { prompts } from "./index.mjs";

defineGlobal("GLOBAL_PROMPTS", (prompt) => prompt);

prompts({});
