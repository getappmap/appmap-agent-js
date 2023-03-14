import { noop, generateDeadcode } from "../../util/index.mjs";
import { InternalAppmapError } from "../../error/index.mjs";

export const createInstrumentation = noop;

export const instrument = generateDeadcode(
  "forbidden call to instrument",
  InternalAppmapError,
);
