import { generateNodeHook } from "./node-recursive.mjs";
export { doesSupportSource, doesSupportTokens } from "./node-recursive.mjs";
export const { hookCommandSource, hookCommandTokens, hookEnvironment } =
  generateNodeHook("process");
