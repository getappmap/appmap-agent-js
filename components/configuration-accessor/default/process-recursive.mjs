import { generateNodeRecorder } from "./node-recursive.mjs";
export const {
  name,
  recursive,
  doesSupportSource,
  doesSupportTokens,
  hookCommandSource,
  hookCommandTokens,
  hookEnvironment,
} = generateNodeRecorder("process");
