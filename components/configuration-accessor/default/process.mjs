import { generateNodeRecorder } from "./node.mjs";
export const {
  name,
  recursive,
  doesSupportSource,
  doesSupportTokens,
  hookCommandSourceAsync,
  hookCommandTokensAsync,
  hookEnvironment,
} = generateNodeRecorder("process");
