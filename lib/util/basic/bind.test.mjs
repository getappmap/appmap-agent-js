
import { strict as Assert } from "assert";
import { bind } from "./bind.mjs";

Assert.equal(
  bind(
    (x) => {
      Assert.equal(x, 123);
      return 456;
    },
    (x) => {
      Assert.equal(x, 456);
      return 789;
    },
  )(123),
  789
);
