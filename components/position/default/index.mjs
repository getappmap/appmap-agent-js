import { assert } from "../../util/index.mjs";
import { InternalAppmapError } from "../../error/index.mjs";

const {
  String,
  parseInt,
  Infinity,
  Math: { abs },
} = globalThis;

const LINE_WEIGHT = 1024;
const COLUMN_WEIGHT = 1;
const THRESHOLD = 10 * LINE_WEIGHT;

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

export const lookupPosition = (map, position1) => {
  const key1 = stringifyPosition(position1);
  if (map.has(stringifyPosition(position1))) {
    return [position1, map.get(key1)];
  } else {
    let best_distance = Infinity;
    let best_position = null;
    let best_value = null;
    for (const [key2, value2] of map) {
      const position2 = parsePosition(key2);
      const distance = measurePositionDistance(position1, position2);
      if (distance < best_distance) {
        best_distance = distance;
        best_position = position2;
        best_value = value2;
      }
    }
    return best_distance <= THRESHOLD ? [best_position, best_value] : null;
  }
};
