import { InternalAppmapError } from "../../error/index.mjs";
import { generateDeadcode } from "../../util/index.mjs";

export const createSource = generateDeadcode(
  "forbidden call to createSource",
  InternalAppmapError,
);

export const resetSourceUrl = generateDeadcode(
  "forbidden call to resetSourceUrl",
  InternalAppmapError,
);

export const extractCommentLabelArray = generateDeadcode(
  "forbidden call to extractCommentLabelArray",
  InternalAppmapError,
);

export const getLeadingCommentArray = generateDeadcode(
  "forbidden call to getLeadingCommentArray",
  InternalAppmapError,
);

export const printComment = generateDeadcode(
  "forbidden call to printComment",
  InternalAppmapError,
);

export const isSourceEmpty = generateDeadcode(
  "forbidden call to isSourceEmpty",
  InternalAppmapError,
);

export const getSourceUrl = generateDeadcode(
  "forbidden call to getSourceUrl",
  InternalAppmapError,
);

export const getSourceContent = generateDeadcode(
  "forbidden call to getSourceContent",
  InternalAppmapError,
);

export const hashSource = generateDeadcode(
  "forbidden call to hashSource",
  InternalAppmapError,
);

export const parseSource = generateDeadcode(
  "forbidden call to parseSource",
  InternalAppmapError,
);

export const makeSourceLocation = generateDeadcode(
  "forbidden call to makeSourceLocation",
  InternalAppmapError,
);

export const fromSourceMessage = generateDeadcode(
  "forbidden call to fromSourceMessage",
  InternalAppmapError,
);

export const toSourceMessage = generateDeadcode(
  "forbidden call to toSourceMessage",
  InternalAppmapError,
);
