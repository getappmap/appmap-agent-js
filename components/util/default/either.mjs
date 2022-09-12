import { assert } from "./assert.mjs";

const { Error } = globalThis;

const LEFT_TAG = false;
const RIGHT_TAG = true;

const generateMake = (tag) => (value) => ({ either: tag, value });
export const makeLeft = generateMake(LEFT_TAG);
export const makeRight = generateMake(RIGHT_TAG);

const generateIs =
  (tag) =>
  ({ either }) =>
    tag === either;
export const isLeft = generateIs(LEFT_TAG);
export const isRight = generateIs(RIGHT_TAG);

const generateFrom =
  (tag) =>
  ({ either, value }) => {
    assert(either === tag, "unexpected either tag");
    return value;
  };
export const fromLeft = generateFrom(LEFT_TAG);
export const fromRight = generateFrom(RIGHT_TAG);

export const fromEither = (
  { either: tag, value },
  transformLeft,
  transformRight,
) => {
  if (tag === LEFT_TAG) {
    return transformLeft(value);
  }
  if (tag === RIGHT_TAG) {
    return transformRight(value);
  }
  /* c8 ignore start */
  throw new Error("invalid either tag");
  /* c8 ignore stop */
};

export const mapEither = (either, pure) => {
  const { either: tag, value } = either;
  if (tag === LEFT_TAG) {
    return either;
  }
  return {
    either: RIGHT_TAG,
    value: pure(value),
  };
};

export const bindEither = (either, transform) => {
  const { either: tag, value } = either;
  if (tag === LEFT_TAG) {
    return either;
  }
  return transform(value);
};
