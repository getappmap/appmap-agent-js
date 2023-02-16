import { generateNodeRecorder } from "./node-recursive.mjs";
export const {
  name,
  recursive,
  doesSupport,
  hookCommandAsync,
  hookEnvironment,
} = generateNodeRecorder("remote");
