import { generateNodeRecorder } from "./node-recursive.mjs";
export const {
  name,
  recursive,
  doesSupportSource,
  doesSupportTokens,
  hookCommandSourceAsync,
  hookCommandTokensAsync,
  hookEnvironment,
} = generateNodeRecorder("process");
