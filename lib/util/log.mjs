import { noop } from "./basic/index.mjs";
import { format } from "./format.mjs";

/* c8 ignore start */
/* eslint-disable no-undef */
const global_process = typeof process !== undefined ? process : null;
/* eslint-enable no-undef */
/* c8 ignore stop */

const enabled =
  global_process !== null &&
  Reflect.getOwnPropertyDescriptor(global_process.env, "APPMAP_LOG") !==
    undefined;

const enabled_log = (template, ...values) => {
  global_process.stdout.write(`${format(template, values)}${"\n"}`);
};

/* c8 ignore start */
export const log = enabled ? enabled_log : noop;
/* c8 ignore stop */
