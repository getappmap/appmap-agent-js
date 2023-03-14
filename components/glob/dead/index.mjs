import { generateDeadcode } from "../../util/index.mjs";
import { InternalAppmapError } from "../../error/index.mjs";

export const compileGlob = generateDeadcode(
  "forbidden compileGlob call",
  InternalAppmapError,
);
