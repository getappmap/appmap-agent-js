import { InternalAppmapError } from "../../error/index.mjs";
import { generateDeadcode } from "../../util/index.mjs";

export const fillSourceMap = generateDeadcode(
  "forbidden call to fillSourceMap",
  InternalAppmapError,
);

export const loadSourceMap = generateDeadcode(
  "forbidden call to loadSourceMap",
  InternalAppmapError,
);
