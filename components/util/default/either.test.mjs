import { strict as Assert } from "assert";
import {
  makeLeft,
  makeRight,
  isLeft,
  fromLeft,
  fromEither,
  mapEither,
  bindEither,
} from "./either.mjs";

const { equal: assertEqual, deepEqual: assertDeepEqual } = Assert;

assertEqual(isLeft(makeLeft(123)), true);
assertEqual(fromLeft(makeLeft(123)), 123);

assertEqual(
  fromEither(
    makeLeft("foo"),
    (x) => x + "bar",
    (x) => x + "qux",
  ),
  "foobar",
);
assertEqual(
  fromEither(
    makeRight("foo"),
    (x) => x + "bar",
    (x) => x + "qux",
  ),
  "fooqux",
);

assertDeepEqual(mapEither(makeLeft(123)), makeLeft(123));
assertDeepEqual(
  mapEither(makeRight("foo"), (x) => x + "bar"),
  makeRight("foobar"),
);

assertDeepEqual(bindEither(makeLeft(123)), makeLeft(123));
assertDeepEqual(
  bindEither(makeRight("foo"), (x) => makeRight(x + "bar")),
  makeRight("foobar"),
);
