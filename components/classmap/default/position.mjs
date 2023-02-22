import { assert } from "../../util/index.mjs";
import { InternalAppmapError } from "../../error/index.mjs";
const {
  String,
  parseInt,
  Math: { abs },
} = globalThis;

const LINE_WEIGHT = 1024;
const COLUMN_WEIGHT = 1;

export const stringifyPosition = ({ line, column }) =>
  `${String(line)}:${String(column)}`;

export const parsePosition = (string) => {
  const parts = /^([0-9]+):([0-9]+)$/u.exec(string);
  assert(parts !== null, "invalid position format", InternalAppmapError);
  return {
    line: parseInt(parts[1]),
    column: parseInt(parts[2]),
  };
};

export const measurePositionDistance = (
  { line: line1, column: column1 },
  { line: line2, column: column2 },
) => LINE_WEIGHT * abs(line2 - line1) + COLUMN_WEIGHT * abs(column2 - column1);
