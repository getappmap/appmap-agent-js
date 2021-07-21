import { strict as Assert } from "assert";
import { bind } from "./bind.mjs";

Assert.equal(bind((x1) => x1, "a")(), "a");

Assert.equal(bind((x1, x2) => x1 + x2, "a")("b"), "ab");

Assert.equal(bind((x1, x2, x3) => x1 + x2 + x3, "a")("b", "c"), "abc");

Assert.equal(
  bind((x1, x2, x3, x4) => x1 + x2 + x3 + x4, "a")("b", "c", "d"),
  "abcd",
);

Assert.equal(
  bind((x1, x2, x3, x4, x5) => x1 + x2 + x3 + x4 + x5, "a")("b", "c", "d", "e"),
  "abcde",
);

Assert.equal(
  bind((x1, x2, x3, x4, x5, x6) => x1 + x2 + x3 + x4 + x5 + x6, "a")(
    "b",
    "c",
    "d",
    "e",
    "f",
  ),
  "abcdef",
);
