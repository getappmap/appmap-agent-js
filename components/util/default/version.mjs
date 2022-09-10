import { assert } from "./assert.mjs";

const {
  Number: { isNaN, parseInt },
  Math: { max },
} = globalThis;

export const matchVersion = (actual, target) => {
  const segments1 = actual.split(".");
  const segments2 = target.split(".");
  const { length: length1 } = segments1;
  const { length: length2 } = segments2;
  const length = max(length1, length2);
  for (let index = 0; index < length; index += 1) {
    if (index >= length1) {
      return false;
    }
    if (index >= length2) {
      return true;
    }
    const segment1 = parseInt(segments1[index], 10);
    assert(!isNaN(segment1), "could not parse version: %o", actual);
    const segment2 = parseInt(segments2[index], 10);
    assert(!isNaN(segment2), "could not parse version: %o", target);
    if (segment1 > segment2) {
      return true;
    }
    if (segment1 < segment2) {
      return false;
    }
  }
  return true;
};
