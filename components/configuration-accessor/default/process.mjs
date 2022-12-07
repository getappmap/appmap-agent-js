import { generateNodeRecorder } from "./node.mjs";
export const {
  name,
  recursive,
  doesSupportSource,
  doesSupportTokens,
  hookCommandSource,
  hookCommandTokens,
  hookEnvironment,
} = generateNodeRecorder("process");
