import { assert } from "./assert.mjs";

const {
  Error,
  Reflect: { apply },
  WeakMap,
} = globalThis;

const cache = new WeakMap();

export const noop = () => {};
export const identity = (x) => x;
export const returnFirst = (x1) => x1;
export const returnSecond = (_x1, x2) => x2;
export const returnThird = (_x1, _x2, x3) => x3;
export const constant = (x) => () => x;

export const memoize = (closure, argument) => {
  if (!cache.has(closure)) {
    cache.set(closure, new WeakMap());
  }
  const history = cache.get(closure);
  if (!history.has(argument)) {
    history.set(argument, closure(argument));
  }
  return history.get(argument);
};

export const compose = (f, g) => {
  const { length: l } = f;
  const { length: m } = g;
  assert(m > 0, "cannot compose a 0-arity function");
  if (l === 0) {
    if (m === 1) {
      return () => g(f());
    }
    if (m === 2) {
      return (y1) => g(f(), y1);
    }
    if (m === 3) {
      return (y1, y2) => g(f(), y1, y2);
    }
    if (m === 4) {
      return (y1, y2, y3) => g(f(), y1, y2, y3);
    }
  }
  if (l === 1) {
    if (m === 1) {
      return (x1) => g(f(x1));
    }
    if (m === 2) {
      return (x1, y1) => g(f(x1), y1);
    }
    if (m === 3) {
      return (x1, y1, y2) => g(f(x1), y1, y2);
    }
    if (m === 4) {
      return (x1, y1, y2, y3) => g(f(x1), y1, y2, y3);
    }
  }
  if (l === 2) {
    if (m === 1) {
      return (x1, x2) => g(f(x1, x2));
    }
    if (m === 2) {
      return (x1, x2, y1) => g(f(x1, x2), y1);
    }
    if (m === 3) {
      return (x1, x2, y1, y2) => g(f(x1, x2), y1, y2);
    }
    if (m === 4) {
      return (x1, x2, y1, y2, y3) => g(f(x1, x2), y1, y2, y3);
    }
  }
  if (l === 3) {
    if (m === 1) {
      return (x1, x2, x3) => g(f(x1, x2, x3));
    }
    if (m === 2) {
      return (x1, x2, x3, y1) => g(f(x1, x2, x3), y1);
    }
    if (m === 3) {
      return (x1, x2, x3, y1, y2) => g(f(x1, x2, x3), y1, y2);
    }
    if (m === 4) {
      return (x1, x2, x3, y1, y2, y3) => g(f(x1, x2, x3), y1, y2, y3);
    }
  }
  throw new Error("arity of out bounds");
};

export const bind = (f, x1) => {
  const { length: l } = f;
  assert(l > 0, "cannot bind a 0-arity function");
  if (l === 1) {
    return () => f(x1);
  }
  if (l === 2) {
    return (x2) => f(x1, x2);
  }
  if (l === 3) {
    return (x2, x3) => f(x1, x2, x3);
  }
  if (l === 4) {
    return (x2, x3, x4) => f(x1, x2, x3, x4);
  }
  if (l === 5) {
    return (x2, x3, x4, x5) => f(x1, x2, x3, x4, x5);
  }
  throw new Error("arity of out bounds");
};

export const spyOnce = (spy, forward) => {
  let called = false;
  return function (...args) {
    if (!called) {
      called = true;
      apply(spy, this, args);
    }
    return apply(forward, this, args);
  };
};

// export const applySafe = (closure, context, inputs, log, recovery) => {
//   try {
//     return apply(closure, context, inputs);
//   } catch (error) {
//     log(error);
//     return recovery;
//   }
// };
