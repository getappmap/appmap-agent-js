import { generateNodeHook } from "./node.mjs";
export { doesSupportSource, doesSupportTokens } from "./node.mjs";
export const { hookCommandSource, hookCommandTokens, hookEnvironment } =
  generateNodeHook("remote");
