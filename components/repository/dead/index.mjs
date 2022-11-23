import { InternalAppmapError } from "../../error/index.mjs";
import { generateDeadcode } from "../../util/index.mjs";

export const extractRepositoryHistory = generateDeadcode(
  "cannot extract repository history (disabled functionality)",
  InternalAppmapError,
);

export const extractRepositoryPackage = generateDeadcode(
  "cannot extract repository package (disabled functionality)",
  InternalAppmapError,
);
