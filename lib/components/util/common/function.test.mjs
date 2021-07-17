import { strict as Assert } from "assert";
import {
  noop,
  identity,
  returnFirst,
  returnSecond,
  returnThird,
  constant,
  compose,
  bind,
} from "./function.mjs";

// noop //

Assert.equal(noop(), undefined);

// identity //

Assert.equal(identity(123), 123);

Assert.equal(returnFirst(123, 456, 789), 123);

Assert.equal(returnSecond(123, 456, 789), 456);

Assert.equal(returnThird(123, 456, 789), 789);

// constant //

Assert.equal(constant(123)(), 123);

// compose //

Assert.equal(
  compose(
    (x) => {
      Assert.equal(x, 123);
      return 456;
    },
    (x) => {
      Assert.equal(x, 456);
      return 789;
    },
  )(123),
  789,
);

// compose //

{
  const setLength = (f, l) => {
    Reflect.defineProperty(f, "length", {
      __proto__: null,
      value: l,
      writable: false,
      configurable: true,
      enumerable: false,
    });
  };
  const f = (...xs) => xs.join("");
  const numbers = "0123456789".split("");
  const g = (z, ...ys) => `${z}|${ys.join("")}`;
  for (const l of [0, 1, 2, 3]) {
    setLength(f, l);
    for (const m of [1, 2, 3, 4]) {
      setLength(g, m);
      const h = compose(f, g);
      Assert.equal(h.length, l + m - 1);
      Assert.equal(
        h(...numbers),
        [...numbers.slice(0, l), "|", ...numbers.slice(l, l + m - 1)].join(""),
      );
    }
  }
}

Assert.throws(() =>
  compose(
    (x1, x2, x3, x4) => {
      Assert.fail();
    },
    (z, y1, y2, y3, y4) => {
      Assert.fail();
    },
  ),
);

// bind //

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

Assert.throws(() =>
  bind((x1, x2, x3, x4, x5, x6) => {
    Assert.fail();
  }, "a"),
);
