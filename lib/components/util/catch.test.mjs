import { strict as Assert } from "assert";
import { catchError } from "./catch.mjs";

Assert.equal(
  catchError(
    (...xs) => {
      Assert.deepEqual(xs, [456]);
      return 789;
    },
    (...xs) => {
      Assert.deepEqual(xs, [123]);
      throw 456;
    },
    123,
  ),
  789,
);
