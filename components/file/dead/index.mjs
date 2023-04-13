import { generateDeadcode } from "../../util/index.mjs";
import { InternalAppmapError } from "../../error/index.mjs";

export const readFile = generateDeadcode(
  "forbidden call to readFile",
  InternalAppmapError,
);

export const readFileAsync = generateDeadcode(
  "forbidden call to readFileAsync",
  InternalAppmapError,
);
