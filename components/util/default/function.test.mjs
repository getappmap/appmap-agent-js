import { assertEqual, assertThrow, assertFail } from "../../__fixture__.mjs";
import {
  noop,
  identity,
  returnFirst,
  returnSecond,
  returnThird,
  constant,
  memoize,
  compose,
  bind,
  spyOnce,
} from "./function.mjs";

const { undefined, Reflect } = globalThis;

// noop //

assertEqual(noop(), undefined);

// identity //

assertEqual(identity(123), 123);

assertEqual(returnFirst(123, 456, 789), 123);

assertEqual(returnSecond(123, 456, 789), 456);

assertEqual(returnThird(123, 456, 789), 789);

// constant //

assertEqual(constant(123)(), 123);

// memoize //

{
  let counter = 0;
  const f = (x) => {
    counter += 1;
    return x;
  };
  const o = {};
  assertEqual(memoize(f, o), o);
  assertEqual(memoize(f, o), o);
  assertEqual(counter, 1);
}

// compose //

assertEqual(
  compose(
    (x) => {
      assertEqual(x, 123);
      return 456;
    },
    (x) => {
      assertEqual(x, 456);
      return 789;
    },
  )(123),
  789,
);

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
      assertEqual(h.length, l + (m - 1));
      assertEqual(
        h(...numbers),
        [...numbers.slice(0, l), "|", ...numbers.slice(l, l + (m - 1))].join(
          "",
        ),
      );
    }
  }
}

assertThrow(() =>
  compose(
    (_x1, _x2, _x3, _x4) => {
      assertFail();
    },
    (_z, _y1, _y2, _y3, _y4) => {
      assertFail();
    },
  ),
);

// bind //

assertEqual(bind((x1) => x1, "a")(), "a");

assertEqual(bind((x1, x2) => x1 + x2, "a")("b"), "ab");

assertEqual(bind((x1, x2, x3) => x1 + x2 + x3, "a")("b", "c"), "abc");

assertEqual(
  bind((x1, x2, x3, x4) => x1 + x2 + x3 + x4, "a")("b", "c", "d"),
  "abcd",
);

assertEqual(
  bind((x1, x2, x3, x4, x5) => x1 + x2 + x3 + x4 + x5, "a")("b", "c", "d", "e"),
  "abcde",
);

assertThrow(() =>
  bind((_x1, _x2, _x3, _x4, _x5, _x6) => {
    assertFail();
  }, "a"),
);

// spyOnce //
{
  let counter = 0;
  const closure = spyOnce(
    () => {
      counter += 1;
    },
    () => "result",
  );
  assertEqual(closure(), "result");
  assertEqual(closure(), "result");
  assertEqual(counter, 1);
}
