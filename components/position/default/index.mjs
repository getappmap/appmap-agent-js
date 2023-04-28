import { assert } from "../../util/index.mjs";
import { InternalAppmapError } from "../../error/index.mjs";

const {
  String,
  parseInt,
  Infinity,
  Math: { abs },
} = globalThis;

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
  { line_weight, column_weight },
) => line_weight * abs(line2 - line1) + column_weight * abs(column2 - column1);

export const lookupPosition = (map, position1, options) => {
  const key1 = stringifyPosition(position1);
  if (map.has(stringifyPosition(position1))) {
    return [position1, map.get(key1)];
  } else {
    let best_distance = Infinity;
    let best_position = null;
    let best_value = null;
    for (const [key2, value2] of map) {
      const position2 = parsePosition(key2);
      const distance = measurePositionDistance(position1, position2, options);
      if (distance < best_distance) {
        best_distance = distance;
        best_position = position2;
        best_value = value2;
      }
    }
    const { threshold } = options;
    return best_distance <= threshold ? [best_position, best_value] : null;
  }
};
