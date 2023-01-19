import { generateNodeRecorder } from "./node.mjs";
export const {
  name,
  recursive,
  doesSupport,
  hookCommandAsync,
  hookEnvironment,
} = generateNodeRecorder("process");
