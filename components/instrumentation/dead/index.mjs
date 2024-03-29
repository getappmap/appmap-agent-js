import { generateDeadcode } from "../../util/index.mjs";
import { InternalAppmapError } from "../../error/index.mjs";

export const instrument = generateDeadcode(
  "forbidden call to instrument",
  InternalAppmapError,
);

export const extractMissingUrlArray = generateDeadcode(
  "forbidden call to extractMissingUrlArray",
  InternalAppmapError,
);
