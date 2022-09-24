'use strict';

var fs = require('fs');
var Ajv = require('ajv');
var Treeify = require('treeify');
var AjvErrorTree = require('ajv-error-tree');
var OperatingSystem = require('os');
var AppmapValidate = require('@appland/appmap-validate');
var Minimatch = require('minimatch');
var BabelParser = require('@babel/parser');
var child_process = require('child_process');
var url = require('url');
var module$1 = require('module');
var Http = require('http');
var net = require('net');
var NetSocketMessaging = require('net-socket-messaging');
var promises = require('fs/promises');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var Ajv__default = /*#__PURE__*/_interopDefaultLegacy(Ajv);
var Treeify__default = /*#__PURE__*/_interopDefaultLegacy(Treeify);
var AjvErrorTree__default = /*#__PURE__*/_interopDefaultLegacy(AjvErrorTree);
var OperatingSystem__default = /*#__PURE__*/_interopDefaultLegacy(OperatingSystem);
var AppmapValidate__default = /*#__PURE__*/_interopDefaultLegacy(AppmapValidate);
var Minimatch__default = /*#__PURE__*/_interopDefaultLegacy(Minimatch);
var BabelParser__default = /*#__PURE__*/_interopDefaultLegacy(BabelParser);
var Http__default = /*#__PURE__*/_interopDefaultLegacy(Http);
var NetSocketMessaging__default = /*#__PURE__*/_interopDefaultLegacy(NetSocketMessaging);

const zip = (array1, array2, _default) => {
  const { length: length2 } = array2;
  return array1.map((element1, index1) => [
    element1,
    index1 < length2 ? array2[index1] : _default,
  ]);
};

var Array = /*#__PURE__*/Object.freeze({
  __proto__: null,
  zip: zip
});

const { Error: Error$j } = globalThis;

class AssertionError extends Error$j {
  constructor(message) {
    super(message);
    this.name = "AssertionError";
  }
}

const assert = (boolean, message) => {
  if (!boolean) {
    throw new AssertionError(message);
  }
};

const generateDeadcode = (message) => () => {
  throw new AssertionError(message);
};

var Assert = /*#__PURE__*/Object.freeze({
  __proto__: null,
  assert: assert,
  generateDeadcode: generateDeadcode
});

const createBox = (value) => ({ value });
const getBox = ({ value }) => value;
const setBox = (box, value) => {
  box.value = value;
};

var Box = /*#__PURE__*/Object.freeze({
  __proto__: null,
  createBox: createBox,
  getBox: getBox,
  setBox: setBox
});

const {
  String: String$4,
  undefined: undefined$4,
  JSON: { stringify: stringifyJSON$6 },
  Reflect: { apply: apply$2 },
  Object: {
    prototype: { toString: Object_prototype_toString },
  },
  Number,
  Number: { isNaN: isNaN$1, NEGATIVE_INFINITY, POSITIVE_INFINITY, NaN: NaN$1 },
} = globalThis;

const toBoolean = (any) =>
  any !== null &&
  any !== undefined$4 &&
  any !== false &&
  any !== 0 &&
  any !== 0n &&
  any !== "";

const toNumber = (any) => {
  if (typeof any === "number") {
    return any;
  } else if (typeof any === "bigint" || typeof any === "string") {
    return Number(any);
  } else {
    return NaN$1;
  }
};

const jsonifyNumber = (number, replacements) => {
  if (number === NEGATIVE_INFINITY) {
    return replacements.NEGATIVE_INFINITY;
  } else if (number === POSITIVE_INFINITY) {
    return replacements.POSITIVE_INFINITY;
  } else if (isNaN$1(number)) {
    return replacements.NaN;
  } else {
    return number;
  }
};

const generateStringify = (stringifyString) => (any) => {
  if (
    typeof any === "boolean" ||
    typeof any === "bigint" ||
    typeof any === "number" ||
    typeof any === "symbol" ||
    any === null ||
    any === undefined$4
  ) {
    return String$4(any);
  } else if (typeof any === "string") {
    return stringifyString(any);
  } else {
    return apply$2(Object_prototype_toString, any, []);
  }
};

const print = generateStringify(stringifyJSON$6);

const identity$1 = (any) => any;

const toString = generateStringify(identity$1);

var Convert = /*#__PURE__*/Object.freeze({
  __proto__: null,
  toBoolean: toBoolean,
  toNumber: toNumber,
  jsonifyNumber: jsonifyNumber,
  print: print,
  toString: toString
});

const createCounter = (value) => ({ value });
const gaugeCounter = ({ value }) => value;
const incrementCounter = (counter) => (counter.value += 1);
const decrementCounter = (counter) => (counter.value -= 1);

var Counter = /*#__PURE__*/Object.freeze({
  __proto__: null,
  createCounter: createCounter,
  gaugeCounter: gaugeCounter,
  incrementCounter: incrementCounter,
  decrementCounter: decrementCounter
});

const { Error: Error$i } = globalThis;

const LEFT_TAG = false;
const RIGHT_TAG = true;

const generateMake = (tag) => (value) => ({ either: tag, value });
const makeLeft = generateMake(LEFT_TAG);
const makeRight = generateMake(RIGHT_TAG);

const generateIs =
  (tag) =>
  ({ either }) =>
    tag === either;
const isLeft = generateIs(LEFT_TAG);
const isRight = generateIs(RIGHT_TAG);

const generateFrom =
  (tag) =>
  ({ either, value }) => {
    assert(either === tag, "unexpected either tag");
    return value;
  };
const fromLeft = generateFrom(LEFT_TAG);
const fromRight = generateFrom(RIGHT_TAG);

const fromEither = (
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
  throw new Error$i("invalid either tag");
  /* c8 ignore stop */
};

const mapEither = (either, pure) => {
  const { either: tag, value } = either;
  if (tag === LEFT_TAG) {
    return either;
  }
  return {
    either: RIGHT_TAG,
    value: pure(value),
  };
};

const bindEither = (either, transform) => {
  const { either: tag, value } = either;
  if (tag === LEFT_TAG) {
    return either;
  }
  return transform(value);
};

var Either = /*#__PURE__*/Object.freeze({
  __proto__: null,
  makeLeft: makeLeft,
  makeRight: makeRight,
  isLeft: isLeft,
  isRight: isRight,
  fromLeft: fromLeft,
  fromRight: fromRight,
  fromEither: fromEither,
  mapEither: mapEither,
  bindEither: bindEither
});

const {
  Error: Error$h,
  String: String$3,
  JSON: { stringify: stringifyJSON$5 },
} = globalThis;

const format = (template, values) => {
  let index = 0;
  const { length } = values;
  const message = template.replace(
    /(%+)($|[^%])/gu,
    (_match, escape, marker) => {
      if (escape.length >= 2) {
        return `${escape.substring(1)}${marker}`;
      }
      assert(index < length, "missing format value");
      const value = values[index];
      index += 1;
      if (marker === "s") {
        assert(typeof value === "string", "expected a string for format");
        return value;
      }
      if (marker === "j") {
        return stringifyJSON$5(value);
      }
      if (marker === "O") {
        try {
          return String$3(value);
        } catch {
          return print(value);
        }
      }
      if (marker === "o") {
        return print(value);
      }
      throw new Error$h("invalid format marker");
    },
  );
  assert(index === length, "missing format marker");
  return message;
};

var Format = /*#__PURE__*/Object.freeze({
  __proto__: null,
  format: format
});

const {
  Error: Error$g,
  Reflect: { apply: apply$1 },
  WeakMap,
} = globalThis;

const cache$1 = new WeakMap();

const noop$1 = () => {};
const identity = (x) => x;
const returnFirst = (x1) => x1;
const returnSecond = (_x1, x2) => x2;
const returnThird = (_x1, _x2, x3) => x3;
const constant = (x) => () => x;

const memoize = (closure, argument) => {
  if (!cache$1.has(closure)) {
    cache$1.set(closure, new WeakMap());
  }
  const history = cache$1.get(closure);
  if (!history.has(argument)) {
    history.set(argument, closure(argument));
  }
  return history.get(argument);
};

const compose = (f, g) => {
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
  throw new Error$g("arity of out bounds");
};

const bind = (f, x1) => {
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
  throw new Error$g("arity of out bounds");
};

const spyOnce = (spy, forward) => {
  let called = false;
  return function (...args) {
    if (!called) {
      called = true;
      apply$1(spy, this, args);
    }
    return apply$1(forward, this, args);
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

var Function = /*#__PURE__*/Object.freeze({
  __proto__: null,
  noop: noop$1,
  identity: identity,
  returnFirst: returnFirst,
  returnSecond: returnSecond,
  returnThird: returnThird,
  constant: constant,
  memoize: memoize,
  compose: compose,
  bind: bind,
  spyOnce: spyOnce
});

const fromMaybe = (maybe, recovery, transform) =>
  maybe === null ? recovery : transform(maybe);

const mapMaybe = (maybe, transform) =>
  maybe === null ? null : transform(maybe);

const recoverMaybe = (maybe, recovery) =>
  maybe === null ? recovery : maybe;

var Maybe = /*#__PURE__*/Object.freeze({
  __proto__: null,
  fromMaybe: fromMaybe,
  mapMaybe: mapMaybe,
  recoverMaybe: recoverMaybe
});

const {
  undefined: undefined$3,
  Object: Object$1,
  Reflect: { getOwnPropertyDescriptor, ownKeys: ownKeys$2, defineProperty },
} = globalThis;

const NULL_DATA_DESCRIPTOR = {
  __proto__: null,
  value: null,
  writable: true,
  enumerable: true,
  configurable: true,
};

/* c8 ignore start */
const hasOwnProperty =
  getOwnPropertyDescriptor(Object$1, "hasOwn") === undefined$3
    ? (object, key) => getOwnPropertyDescriptor(object, key) !== undefined$3
    : Object$1.hasOwn;
/* c8 ignore stop */

const getOwnProperty = (object, key, _default) =>
  hasOwnProperty(object, key) ? object[key] : _default;

const setOwnProperty = (object, key, value) => {
  if (!hasOwnProperty(object, key)) {
    defineProperty(object, key, NULL_DATA_DESCRIPTOR);
  }
  object[key] = value;
};

const assignProperty = ({ object, key, value }) => {
  object[key] = value;
};

const coalesce = (value, key, _default) => {
  if (
    typeof value === "function" ||
    (typeof value === "object" && value !== null)
  ) {
    return getOwnProperty(value, key, _default);
  }
  return _default;
};

const coalesceCaseInsensitive = (value, key1, _default) => {
  if (
    typeof value === "function" ||
    (typeof value === "object" && value !== null)
  ) {
    key1 = key1.toLowerCase();
    for (const key2 of ownKeys$2(value)) {
      if (key2.toLowerCase() === key1) {
        return getOwnProperty(value, key2, _default);
      }
    }
  }
  return _default;
};

const generateGet =
  (key) =>
  ({ [key]: value }) =>
    value;

var Object$2 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  hasOwnProperty: hasOwnProperty,
  getOwnProperty: getOwnProperty,
  setOwnProperty: setOwnProperty,
  assignProperty: assignProperty,
  coalesce: coalesce,
  coalesceCaseInsensitive: coalesceCaseInsensitive,
  generateGet: generateGet
});

const {
  Number: { isNaN, parseInt: parseInt$1 },
  Math: { max },
} = globalThis;

const matchVersion = (actual, target) => {
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
    const segment1 = parseInt$1(segments1[index], 10);
    assert(!isNaN(segment1), "could not parse version: %o");
    const segment2 = parseInt$1(segments2[index], 10);
    assert(!isNaN(segment2), "could not parse version: %o");
    if (segment1 > segment2) {
      return true;
    }
    if (segment1 < segment2) {
      return false;
    }
  }
  return true;
};

var Version = /*#__PURE__*/Object.freeze({
  __proto__: null,
  matchVersion: matchVersion
});

var util$default = (_dependencies) => ({
  ...Array,
  ...Assert,
  ...Box,
  ...Convert,
  ...Counter,
  ...Either,
  ...Format,
  ...Function,
  ...Object$2,
  ...Maybe,
  ...Version,
});

const {
  Reflect: { apply },
  Error: Error$f,
  Promise: Promise$4,
  setTimeout: setTimeout$2,
  process: { exit, stderr },
} = globalThis;

const { write } = stderr;

var violation$exit = (_dependencies) => {
  const signalViolation = (message) => {
    apply(write, stderr, [`${message}${"\n"}`]);
    exit(1);
    setTimeout$2(() => {
      throw new Error$f(`Timeout violation notification >> ${message}`);
    }, 0);
  };
  return {
    throwViolation: (message) => {
      signalViolation(message);
      throw new Error$f(`Violation notification >> ${message}`);
    },
    throwViolationAsync: (message) => {
      signalViolation(message);
      return Promise$4.reject(
        new Error$f(`Asynchronous violation notification >> ${message}`),
      );
    },
    catchViolation: (closure, _recover) => closure(),
    catchViolationAsync: (promise, _recover) => promise,
  };
};

var expect_inner$default = (dependencies) => {
  const {
    util: { format },
    violation: { throwViolation, throwViolationAsync },
  } = dependencies;
  return {
    expect: (boolean, template, ...rest) => {
      if (!boolean) {
        throwViolation(format(template, rest));
      }
    },
    expectSuccess: (closure, template, ...rest) => {
      try {
        return closure();
      } catch (error) {
        throw throwViolation(format(template, [...rest, error]));
      }
    },
    expectSuccessAsync: async (promise, template, ...rest) => {
      try {
        return await promise;
      } catch (error) {
        return throwViolationAsync(format(template, [...rest, error]));
      }
    },
    expectDeadcode:
      (template, ...rest1) =>
      (...rest2) => {
        throwViolation(format(template, [...rest1, ...rest2]));
      },
    expectDeadcodeAsync:
      (reject, template, ...rest1) =>
      (...rest2) =>
        throwViolationAsync(format(template, [...rest1, ...rest2])).catch(
          reject,
        ),
  };
};

//                 | InternalError | ExternalError  | InnerExternalError   | OuterExternalError |
// ==============================================================================================
// Location of the | Inside the    | Out of the     | Out of the module or | Out of the package |
// root cause of   | module or its | module or its  | its deps. but still  |                    |
// the error       | deps.         | deps           | inside the package   |                    |
// ==============================================================================================
// Did the module  | No            | Yes            | Yes                  | Yes                |
// and its deps.   |               |                |                      |                    |
// behaved as      |               |                |                      |                    |
// expected?       |               |                |                      |                    |
// ==============================================================================================
// Did the package | No            | Maybe          | No                   | Yes                |
// behaved as      |               |                |                      |                    |
// expected?       |               |                |                      |                    |
// ==============================================================================================
// Is a bug?       | Yes           | Maybe          | Yes                  | No                 |
// ==============================================================================================
//
// ** Any other kind of error must be considered as an internal error. **
//
// NB: The classification above presuposes that types are correct.
// For instance, consider the following function:
//
// const exponent = (base /* integer */, exponent /* integer */) => {
//   if (exponent < 0) {
//     throw new ExternalError("expected a positive integer");
//   }
//   let result = 1;
//   for (let index = 0; index < exponent; index++) {
//     result *= base;
//   }
//   if (result !== base ** exponent) {
//     throw new InternalError("unexpected result");
//   }
//   return result;
// };
//
// Its implementation is correct and as long as it is given integers,
// it will never throw any other exceptions than ExternalError.
// However if we pass floats it will throw a ModuleInternalError.
// And if we pass symbols it will throw a TypeError.
//
// export class InternalError extends Error;
//
// export class ExternalError extends Error;
//
// export class InnerExternalError extends ExternalError;
//
// export class OuterExternalError extends ExternalError;

var expect$default = (dependencies) => {
  const { "expect-inner": expect } = dependencies;
  return expect;
};

// NB: Synchronous loggin is important to avoid

const {
  URL: URL$7,
  process: process$1,
  JSON: { parse: parseJSON$5 },
} = globalThis;

var log_inner$write_sync = (dependencies) => {
  const {
    util: { format, hasOwnProperty },
  } = dependencies;
  const file = hasOwnProperty(process$1.env, "APPMAP_LOG_FILE")
    ? parseJSON$5(process$1.env.APPMAP_LOG_FILE)
    : 2;
  const fd = typeof file === "number" ? file : fs.openSync(new URL$7(file), "w");
  const generateLog =
    (name) =>
    (template, ...values) => {
      fs.writeSync(fd, `APPMAP-${name} ${format(template, values)}\n`);
    };
  return {
    logDebug: generateLog("DEBUG"),
    logInfo: generateLog("INFO"),
    logWarning: generateLog("WARNING"),
    logError: generateLog("ERROR"),
  };
};

const {
  Map: Map$b,
  Error: Error$e,
  Object: { entries: toEntries$3, fromEntries },
} = globalThis;

const levels = new Map$b([
  ["Debug", 1],
  ["Info", 2],
  ["Warning", 3],
  ["Error", 4],
  ["Off", 5],
]);

const get = (map, key) => {
  if (!map.has(key)) {
    throw new Error$e("missing map key");
  }
  return map.get(key);
};

const noop = () => {};

// const returnNoop = () => () => {};

const levelLog = (logs, min_level_name) => {
  const min_level = get(levels, min_level_name);
  return fromEntries(
    toEntries$3(logs).flatMap(([method_name, log]) => {
      const level_name = method_name.substring(3);
      return [
        [`log${level_name}`, get(levels, level_name) >= min_level ? log : noop],
        [
          `logGuard${level_name}`,
          get(levels, level_name) >= min_level
            ? (guard, ...args) => {
                if (guard) {
                  log(...args);
                }
              }
            : noop,
        ],
        // [
        //   `bindLog${level_name}`,
        //   get(levels, level_name) >= min_level
        //     ? (...xs) => (...ys) => {
        //       log(xs.concat(ys));
        //     }
        //     : returnNoop,
        // ],
      ];
    }),
  );
};

var log$debug = (dependencies) => {
  const { "log-inner": logs } = dependencies;
  return levelLog(logs, "Debug");
};

var log$error = (dependencies) => {
  const { "log-inner": logs } = dependencies;
  return levelLog(logs, "Error");
};

var log$info = (dependencies) => {
  const { "log-inner": logs } = dependencies;
  return levelLog(logs, "Info");
};

var log$off = (dependencies) => {
  const { "log-inner": logs } = dependencies;
  return levelLog(logs, "Off");
};

var log$warning = (dependencies) => {
  const { "log-inner": logs } = dependencies;
  return levelLog(logs, "Warning");
};

const schema = [
  {
    "$id": "language",
    "const": "javascript"
  },
  {
    "$id": "socket",
    "enum": [
      "unix",
      "net"
    ]
  },
  {
    "$id": "encoding",
    "enum": [
      "buffer",
      "utf8",
      "utf16le",
      "latin1"
    ]
  },
  {
    "$id": "ordering",
    "enum": [
      "chronological",
      "causal"
    ]
  },
  {
    "$id": "log-level",
    "enum": [
      "debug",
      "info",
      "warning",
      "error",
      "off"
    ]
  },
  {
    "$id": "file-type",
    "enum": [
      "script",
      "module"
    ]
  },
  {
    "$id": "recorder",
    "enum": [
      "process",
      "mocha",
      "manual",
      "remote"
    ]
  },
  {
    "$id": "stdio-stream",
    "enum": [
      "ignore",
      "pipe",
      "inherit"
    ]
  },
  {
    "$id": "signal",
    "enum": [
      "SIGINT",
      "SIGTERM",
      "SIGKILL"
    ]
  },
  {
    "$id": "indent",
    "enum": [
      0,
      2,
      4,
      8
    ]
  },
  {
    "$id": "separator",
    "type": "string",
    "pattern": "^\\P{ID_Continue}$"
  },
  {
    "$id": "url",
    "type": "string",
    "pattern": "^[a-z]+://"
  },
  {
    "$id": "regular-identifier",
    "type": "string",
    "pattern": "^[a-zA-Z_$][a-zA-Z_$-9]*$"
  },
  {
    "$id": "path",
    "type": "string"
  },
  {
    "$id": "regexp",
    "type": "string"
  },
  {
    "$id": "basename",
    "type": "string",
    "pattern": "^[^/.]+$"
  },
  {
    "$id": "extension",
    "type": "string",
    "pattern": "^\\.[^/]+$"
  },
  {
    "$id": "natural",
    "type": "integer",
    "minimum": 0,
    "maximum": 9007199254740991
  },
  {
    "$id": "nullable-natural",
    "anyOf": [
      {
        "const": null
      },
      {
        "$ref": "natural"
      }
    ]
  },
  {
    "$id": "index",
    "$ref": "natural"
  },
  {
    "$id": "group",
    "type": "number"
  },
  {
    "$id": "time",
    "type": "number"
  },
  {
    "$id": "heartbeat",
    "$ref": "nullable-natural"
  },
  {
    "$id": "threshold",
    "$ref": "nullable-natural"
  },
  {
    "$id": "port-number",
    "type": "integer",
    "minimum": 1,
    "maximum": 65535
  },
  {
    "$id": "port",
    "anyOf": [
      {
        "const": 0
      },
      {
        "const": ""
      },
      {
        "$ref": "port-number"
      },
      {
        "$ref": "path"
      }
    ]
  },
  {
    "$id": "cooked-port",
    "anyOf": [
      {
        "const": 0
      },
      {
        "const": ""
      },
      {
        "$ref": "port-number"
      },
      {
        "$ref": "url"
      }
    ]
  },
  {
    "$id": "name-version-string",
    "type": "string",
    "pattern": "^[^@]+(@[^@]+)?$"
  },
  {
    "$id": "name-version-object",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "name",
      "version"
    ],
    "properties": {
      "name": {
        "type": "string"
      },
      "version": {
        "type": "string",
        "nullable": true
      }
    }
  },
  {
    "$id": "name-version",
    "anyOf": [
      {
        "$ref": "name-version-string"
      },
      {
        "$ref": "name-version-object"
      }
    ]
  },
  {
    "$id": "recording-string",
    "type": "string",
    "pattern": "^[^.]+.[^.]+$"
  },
  {
    "$id": "recording-object",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "defined-class",
      "method-id"
    ],
    "properties": {
      "defined-class": {
        "type": "string"
      },
      "method-id": {
        "type": "string"
      }
    }
  },
  {
    "$id": "recording",
    "anyOf": [
      {
        "$ref": "recording-string"
      },
      {
        "$ref": "recording-object"
      }
    ]
  },
  {
    "$id": "criteria",
    "anyOf": [
      {
        "type": "boolean"
      },
      {
        "type": "string"
      }
    ]
  },
  {
    "$id": "combinator",
    "enum": [
      "and",
      "or"
    ]
  },
  {
    "$id": "exclude",
    "type": "array",
    "items": {
      "$ref": "exclusion"
    }
  },
  {
    "$id": "exclusion",
    "anyOf": [
      {
        "type": "string"
      },
      {
        "type": "object",
        "properties": {
          "combinator": {
            "$ref": "combinator"
          },
          "qualified-name": {
            "$ref": "criteria"
          },
          "name": {
            "$ref": "criteria"
          },
          "every-label": {
            "$ref": "criteria"
          },
          "some-label": {
            "$ref": "criteria"
          },
          "excluded": {
            "type": "boolean"
          },
          "recursive": {
            "type": "boolean"
          }
        }
      }
    ]
  },
  {
    "$id": "cooked-exclude",
    "type": "array",
    "items": {
      "$ref": "cooked-exclusion"
    }
  },
  {
    "$id": "cooked-exclusion",
    "type": "object",
    "required": [
      "combinator",
      "qualified-name",
      "name",
      "every-label",
      "some-label",
      "excluded",
      "recursive"
    ],
    "properties": {
      "combinator": {
        "$ref": "combinator"
      },
      "qualified-name": {
        "$ref": "criteria"
      },
      "name": {
        "$ref": "criteria"
      },
      "every-label": {
        "$ref": "criteria"
      },
      "some-label": {
        "$ref": "criteria"
      },
      "excluded": {
        "type": "boolean"
      },
      "recursive": {
        "type": "boolean"
      }
    }
  },
  {
    "$id": "serialization",
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "maximum-print-length": {
        "type": "number",
        "nullable": true,
        "minimum": 0
      },
      "maximum-properties-length": {
        "type": "number",
        "nullable": true,
        "minimum": 0
      },
      "impure-printing": {
        "type": "boolean"
      },
      "impure-constructor-naming": {
        "type": "boolean"
      },
      "impure-array-inspection": {
        "type": "boolean"
      },
      "impure-error-inspection": {
        "type": "boolean"
      },
      "impure-hash-inspection": {
        "type": "boolean"
      }
    }
  },
  {
    "$id": "package",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "name",
      "version",
      "homepage"
    ],
    "properties": {
      "name": {
        "type": "string"
      },
      "version": {
        "type": "string"
      },
      "homepage": {
        "type": "string",
        "nullable": true
      }
    }
  },
  {
    "$id": "stdio",
    "anyOf": [
      {
        "$ref": "stdio-stream"
      },
      {
        "type": "array",
        "minItems": 3,
        "maxItems": 3,
        "items": [
          {
            "$ref": "stdio-stream"
          },
          {
            "$ref": "stdio-stream"
          },
          {
            "$ref": "stdio-stream"
          }
        ]
      }
    ]
  },
  {
    "$id": "log",
    "anyOf": [
      {
        "$ref": "log-level"
      },
      {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "level": {
            "$ref": "log-level"
          },
          "file": {
            "anyOf": [
              {
                "$ref": "path"
              },
              {
                "const": 1
              },
              {
                "const": 2
              }
            ]
          }
        }
      }
    ]
  },
  {
    "$id": "cooked-log",
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "level": {
        "$ref": "log-level"
      },
      "file": {
        "anyOf": [
          {
            "$ref": "url"
          },
          {
            "const": 1
          },
          {
            "const": 2
          }
        ]
      }
    }
  },
  {
    "$id": "env",
    "type": "object",
    "additionalProperties": false,
    "patternProperties": {
      "^": {
        "type": "string"
      }
    }
  },
  {
    "$id": "specifier",
    "anyOf": [
      {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "regexp"
        ],
        "properties": {
          "regexp": {
            "$ref": "regexp"
          },
          "flags": {
            "type": "string"
          },
          "enabled": {
            "type": "boolean"
          },
          "shallow": {
            "type": "boolean"
          },
          "exclude": {
            "$ref": "exclude"
          },
          "inline-source": {
            "type": "boolean",
            "nullable": true
          }
        }
      },
      {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "glob"
        ],
        "properties": {
          "glob": {
            "type": "string"
          },
          "enabled": {
            "type": "boolean"
          },
          "shallow": {
            "type": "boolean"
          },
          "exclude": {
            "$ref": "exclude"
          },
          "inline-source": {
            "type": "boolean",
            "nullable": true
          }
        }
      },
      {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "path"
        ],
        "properties": {
          "path": {
            "type": "string"
          },
          "recursive": {
            "type": "boolean"
          },
          "enabled": {
            "type": "boolean"
          },
          "shallow": {
            "type": "boolean"
          },
          "exclude": {
            "$ref": "exclude"
          },
          "inline-source": {
            "type": "boolean",
            "nullable": true
          }
        }
      },
      {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "dist"
        ],
        "properties": {
          "dist": {
            "type": "string"
          },
          "recursive": {
            "type": "boolean"
          },
          "external": {
            "type": "boolean"
          },
          "enabled": {
            "type": "boolean"
          },
          "shallow": {
            "type": "boolean"
          },
          "exclude": {
            "$ref": "exclude"
          },
          "inline-source": {
            "type": "boolean",
            "nullable": true
          }
        }
      }
    ]
  },
  {
    "$id": "package-specifier",
    "anyOf": [
      {
        "type": "string"
      },
      {
        "$ref": "specifier"
      }
    ]
  },
  {
    "$id": "enabled-specifier",
    "anyOf": [
      {
        "type": "boolean"
      },
      {
        "type": "string"
      },
      {
        "allOf": [
          {
            "$ref": "specifier"
          },
          {
            "not": {
              "anyOf": [
                {
                  "type": "object",
                  "required": [
                    "shallow"
                  ]
                },
                {
                  "type": "object",
                  "required": [
                    "inline-source"
                  ]
                },
                {
                  "type": "object",
                  "required": [
                    "exclude"
                  ]
                }
              ]
            }
          }
        ]
      }
    ]
  },
  {
    "$id": "cooked-specifier",
    "anyOf": [
      {
        "type": "boolean"
      },
      {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "base",
          "source",
          "flags"
        ],
        "properties": {
          "base": {
            "$ref": "url"
          },
          "source": {
            "type": "string"
          },
          "flags": {
            "type": "string"
          }
        }
      }
    ]
  },
  {
    "$id": "command-options",
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "shell": {
        "type": "array",
        "nullable": true,
        "items": {
          "type": "string"
        },
        "minItems": 1
      },
      "encoding": {
        "$ref": "encoding"
      },
      "env": {
        "$ref": "env"
      },
      "stdio": {
        "$ref": "stdio"
      },
      "timeout": {
        "type": "integer",
        "minimum": 0
      },
      "killSignal": {
        "$ref": "signal"
      }
    }
  },
  {
    "$id": "cooked-command-options",
    "allOf": [
      {
        "$ref": "command-options"
      },
      {
        "type": "object",
        "required": [
          "shell",
          "encoding",
          "env",
          "stdio",
          "timeout",
          "killSignal"
        ]
      }
    ]
  },
  {
    "$id": "agent",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "directory",
      "package"
    ],
    "properties": {
      "directory": {
        "$ref": "url"
      },
      "package": {
        "$ref": "package"
      }
    }
  },
  {
    "$id": "repository",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "directory",
      "history",
      "package"
    ],
    "properties": {
      "directory": {
        "$ref": "url"
      },
      "history": {
        "type": "object",
        "nullable": true
      },
      "package": {
        "anyOf": [
          {
            "const": null
          },
          {
            "$ref": "package"
          }
        ]
      }
    }
  },
  {
    "$id": "external-configuration",
    "type": "object",
    "properties": {
      "agent": {
        "$ref": "agent"
      },
      "repository": {
        "$ref": "repository"
      },
      "scenarios": {
        "type": "object",
        "additionalProperties": false,
        "patternProperties": {
          "^": {
            "$ref": "external-configuration"
          }
        }
      },
      "scenario": {
        "$ref": "regexp"
      },
      "recursive-process-recording": {
        "type": "boolean"
      },
      "command": {
        "anyOf": [
          {
            "type": "string"
          },
          {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        ]
      },
      "command-options": {
        "$ref": "command-options"
      },
      "validate": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "message": {
            "type": "boolean"
          },
          "appmap": {
            "type": "boolean"
          }
        }
      },
      "log": {
        "$ref": "log"
      },
      "host": {
        "const": "localhost"
      },
      "session": {
        "$ref": "basename"
      },
      "trace-port": {
        "$ref": "port"
      },
      "trace-protocol": {
        "const": "TCP"
      },
      "track-port": {
        "$ref": "port"
      },
      "track-protocol": {
        "const": "HTTP/1.1"
      },
      "intercept-track-port": {
        "$ref": "regexp"
      },
      "intercept-track-protocol": {
        "const": "HTTP/1.1"
      },
      "socket": {
        "$ref": "socket"
      },
      "heartbeat": {
        "$ref": "heartbeat"
      },
      "threshold": {
        "$ref": "threshold"
      },
      "recorder": {
        "$ref": "recorder"
      },
      "inline-source": {
        "type": "boolean"
      },
      "hooks": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "cjs": {
            "type": "boolean"
          },
          "esm": {
            "type": "boolean"
          },
          "eval": {
            "anyOf": [
              {
                "type": "boolean"
              },
              {
                "type": "array",
                "items": {
                  "type": "string"
                }
              }
            ]
          },
          "apply": {
            "type": "boolean"
          },
          "http": {
            "type": "boolean"
          },
          "mysql": {
            "type": "boolean"
          },
          "pg": {
            "type": "boolean"
          },
          "sqlite3": {
            "type": "boolean"
          }
        }
      },
      "ordering": {
        "$ref": "ordering"
      },
      "processes": {
        "anyOf": [
          {
            "$ref": "enabled-specifier"
          },
          {
            "type": "array",
            "items": {
              "$ref": "enabled-specifier"
            }
          }
        ]
      },
      "hidden-identifier": {
        "$ref": "regular-identifier"
      },
      "main": {
        "$ref": "path"
      },
      "engine": {
        "type": "string"
      },
      "language": {
        "$ref": "language"
      },
      "packages": {
        "anyOf": [
          {
            "$ref": "package-specifier"
          },
          {
            "type": "array",
            "items": {
              "$ref": "package-specifier"
            }
          }
        ]
      },
      "exclude": {
        "$ref": "exclude"
      },
      "anonymous-name-separator": {
        "$ref": "separator"
      },
      "function-name-placeholder": {
        "type": "string"
      },
      "collapse-package-hierachy": {
        "type": "boolean"
      },
      "recording": {
        "$ref": "recording"
      },
      "serialization": {
        "$ref": "serialization"
      },
      "pruning": {
        "type": "boolean"
      },
      "appmap_dir": {
        "$ref": "path"
      },
      "appmap_file": {
        "$ref": "basename"
      },
      "name": {
        "type": "string"
      },
      "map-name": {
        "type": "string"
      },
      "feature": {
        "type": "string"
      },
      "feature-group": {
        "type": "string"
      },
      "labels": {
        "type": "array",
        "items": {
          "type": "string"
        }
      },
      "frameworks": {
        "type": "array",
        "items": {
          "$ref": "name-version"
        }
      }
    }
  },
  {
    "$id": "config",
    "$ref": "external-configuration"
  },
  {
    "$id": "internal-configuration",
    "type": "object",
    "additionalProperties": false,
    "minProperties": 41,
    "properties": {
      "socket": {
        "$ref": "socket"
      },
      "heartbeat": {
        "$ref": "heartbeat"
      },
      "threshold": {
        "$ref": "threshold"
      },
      "scenario": {
        "$ref": "regexp"
      },
      "scenarios": {
        "type": "array",
        "items": {
          "type": "object",
          "required": [
            "key",
            "value",
            "base"
          ],
          "properties": {
            "key": {
              "type": "string"
            },
            "value": {
              "$ref": "external-configuration"
            },
            "base": {
              "$ref": "url"
            }
          }
        }
      },
      "recursive-process-recording": {
        "type": "boolean"
      },
      "command": {
        "type": "object",
        "nullable": true,
        "properties": {
          "tokens": {
            "type": "array",
            "nullable": true,
            "items": {
              "type": "string"
            }
          },
          "script": {
            "type": "string",
            "nullable": true
          },
          "base": {
            "$ref": "url"
          }
        }
      },
      "command-options": {
        "$ref": "cooked-command-options"
      },
      "validate": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "message",
          "appmap"
        ],
        "properties": {
          "message": {
            "type": "boolean"
          },
          "appmap": {
            "type": "boolean"
          }
        }
      },
      "agent": {
        "anyOf": [
          {
            "const": null
          },
          {
            "$ref": "agent"
          }
        ]
      },
      "repository": {
        "$ref": "repository"
      },
      "log": {
        "$ref": "cooked-log"
      },
      "host": {
        "const": "localhost"
      },
      "session": {
        "anyOf": [
          {
            "const": null
          },
          {
            "$ref": "basename"
          }
        ]
      },
      "trace-port": {
        "$ref": "cooked-port"
      },
      "trace-protocol": {
        "const": "TCP"
      },
      "track-port": {
        "$ref": "cooked-port"
      },
      "track-protocol": {
        "const": "HTTP/1.1"
      },
      "intercept-track-port": {
        "$ref": "regexp"
      },
      "intercept-track-protocol": {
        "const": "HTTP/1.1"
      },
      "recorder": {
        "anyOf": [
          {
            "const": null
          },
          {
            "$ref": "recorder"
          }
        ]
      },
      "inline-source": {
        "type": "boolean"
      },
      "hooks": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "cjs",
          "esm",
          "apply",
          "http",
          "mysql",
          "pg",
          "sqlite3"
        ],
        "properties": {
          "cjs": {
            "type": "boolean"
          },
          "esm": {
            "type": "boolean"
          },
          "eval": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "apply": {
            "type": "boolean"
          },
          "http": {
            "type": "boolean"
          },
          "mysql": {
            "type": "boolean"
          },
          "pg": {
            "type": "boolean"
          },
          "sqlite3": {
            "type": "boolean"
          }
        }
      },
      "ordering": {
        "$ref": "ordering"
      },
      "processes": {
        "type": "array",
        "items": {
          "type": "array",
          "minItems": 2,
          "maxItems": 2,
          "items": [
            {
              "$ref": "cooked-specifier"
            },
            {
              "type": "boolean"
            }
          ]
        }
      },
      "hidden-identifier": {
        "$ref": "regular-identifier"
      },
      "main": {
        "anyOf": [
          {
            "const": null
          },
          {
            "$ref": "url"
          }
        ]
      },
      "engine": {
        "type": "string",
        "nullable": true
      },
      "language": {
        "$ref": "language"
      },
      "packages": {
        "type": "array",
        "items": {
          "type": "array",
          "minItems": 2,
          "maxItems": 2,
          "items": [
            {
              "$ref": "cooked-specifier"
            },
            {
              "type": "object",
              "properties": {
                "enabled": {
                  "type": "boolean"
                },
                "shallow": {
                  "type": "boolean"
                },
                "inline-source": {
                  "type": "boolean",
                  "nullable": true
                },
                "exclude": {
                  "$ref": "cooked-exclude"
                }
              }
            }
          ]
        }
      },
      "exclude": {
        "$ref": "cooked-exclude"
      },
      "anonymous-name-separator": {
        "$ref": "separator"
      },
      "function-name-placeholder": {
        "type": "string"
      },
      "collapse-package-hierachy": {
        "type": "boolean"
      },
      "recording": {
        "anyOf": [
          {
            "const": null
          },
          {
            "$ref": "recording-object"
          }
        ]
      },
      "serialization": {
        "allOf": [
          {
            "$ref": "serialization"
          },
          {
            "type": "object",
            "required": [
              "maximum-print-length",
              "maximum-properties-length",
              "impure-printing",
              "impure-constructor-naming",
              "impure-array-inspection",
              "impure-error-inspection",
              "impure-hash-inspection"
            ]
          }
        ]
      },
      "pruning": {
        "type": "boolean"
      },
      "appmap_dir": {
        "$ref": "url"
      },
      "appmap_file": {
        "anyOf": [
          {
            "$ref": "basename"
          },
          {
            "const": null
          }
        ]
      },
      "name": {
        "type": "string",
        "nullable": true
      },
      "map-name": {
        "type": "string",
        "nullable": true
      },
      "feature": {
        "type": "string",
        "nullable": true
      },
      "feature-group": {
        "type": "string",
        "nullable": true
      },
      "labels": {
        "type": "array",
        "items": {
          "type": "string"
        }
      },
      "frameworks": {
        "type": "array",
        "items": {
          "$ref": "name-version"
        }
      }
    }
  },
  {
    "$id": "start-message",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "type",
      "track",
      "configuration",
      "url"
    ],
    "properties": {
      "type": {
        "const": "start"
      },
      "track": {
        "type": "string"
      },
      "configuration": {
        "$ref": "external-configuration"
      },
      "url": {
        "anyOf": [
          {
            "const": null
          },
          {
            "$ref": "url"
          }
        ]
      }
    }
  },
  {
    "$id": "stop-message",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "type",
      "track",
      "status"
    ],
    "properties": {
      "type": {
        "const": "stop"
      },
      "track": {
        "type": "string"
      },
      "status": {
        "type": "integer",
        "minimum": 0,
        "maximum": 255
      }
    }
  },
  {
    "$id": "error-message",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "type",
      "name",
      "message",
      "stack"
    ],
    "properties": {
      "type": {
        "const": "error"
      },
      "name": {
        "type": "string",
        "nullable": true
      },
      "message": {
        "type": "string",
        "nullable": true
      },
      "stack": {
        "type": "string",
        "nullable": true
      }
    }
  },
  {
    "$id": "source-message",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "type",
      "content",
      "url",
      "shallow",
      "inline",
      "exclude"
    ],
    "properties": {
      "type": {
        "const": "source"
      },
      "content": {
        "type": "string",
        "nullable": true
      },
      "url": {
        "$ref": "url"
      },
      "shallow": {
        "type": "boolean"
      },
      "inline": {
        "type": "boolean"
      },
      "exclude": {
        "type": "array",
        "items": {
          "$ref": "cooked-exclusion"
        }
      }
    }
  },
  {
    "$id": "amend-message",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "type",
      "site",
      "tab",
      "payload"
    ],
    "properties": {
      "type": {
        "const": "amend"
      },
      "site": {
        "$ref": "site"
      },
      "tab": {
        "$ref": "tab"
      },
      "payload": {
        "$ref": "payload"
      }
    }
  },
  {
    "$id": "tab",
    "$ref": "natural"
  },
  {
    "$id": "site",
    "enum": [
      "begin",
      "end",
      "before",
      "after"
    ]
  },
  {
    "$id": "group-message",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "type",
      "group",
      "child",
      "description"
    ],
    "properties": {
      "type": {
        "const": "group"
      },
      "group": {
        "$ref": "group"
      },
      "child": {
        "$ref": "group"
      },
      "description": {
        "type": "string"
      }
    }
  },
  {
    "$id": "event-message",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "type",
      "site",
      "tab",
      "group",
      "time",
      "payload"
    ],
    "properties": {
      "type": {
        "const": "event"
      },
      "site": {
        "$ref": "site"
      },
      "tab": {
        "$ref": "tab"
      },
      "group": {
        "$ref": "group"
      },
      "time": {
        "type": "number"
      },
      "payload": {
        "$ref": "payload"
      }
    }
  },
  {
    "$id": "serial",
    "anyOf": [
      {
        "const": null
      },
      {
        "$ref": "primitive-serial"
      },
      {
        "$ref": "symbol-serial"
      },
      {
        "$ref": "reference-serial"
      }
    ]
  },
  {
    "$id": "primitive-serial",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "type",
      "print"
    ],
    "properties": {
      "type": {
        "enum": [
          "null",
          "undefined",
          "boolean",
          "number",
          "string",
          "bigint"
        ]
      },
      "print": {
        "type": "string"
      }
    }
  },
  {
    "$id": "symbol-serial",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "type",
      "print",
      "index"
    ],
    "properties": {
      "type": {
        "const": "symbol"
      },
      "print": {
        "type": "string"
      },
      "index": {
        "$ref": "natural"
      }
    }
  },
  {
    "$id": "reference-serial",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "type",
      "print",
      "index",
      "constructor",
      "specific"
    ],
    "properties": {
      "type": {
        "enum": [
          "object",
          "function"
        ]
      },
      "print": {
        "type": "string"
      },
      "index": {
        "$ref": "natural"
      },
      "constructor": {
        "type": "string",
        "nullable": true
      },
      "specific": {
        "anyOf": [
          {
            "const": null
          },
          {
            "$ref": "error-specific"
          },
          {
            "$ref": "array-specific"
          },
          {
            "$ref": "hash-specific"
          }
        ]
      }
    }
  },
  {
    "$id": "error-specific",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "type",
      "name",
      "message",
      "stack"
    ],
    "properties": {
      "type": {
        "const": "error"
      },
      "name": {
        "type": "string",
        "nullable": true
      },
      "message": {
        "type": "string",
        "nullable": true
      },
      "stack": {
        "type": "string",
        "nullable": true
      }
    }
  },
  {
    "$id": "array-specific",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "type",
      "length"
    ],
    "properties": {
      "type": {
        "const": "array"
      },
      "length": {
        "$ref": "natural"
      }
    }
  },
  {
    "$id": "hash-specific",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "type",
      "length",
      "properties"
    ],
    "properties": {
      "type": {
        "const": "hash"
      },
      "length": {
        "$ref": "natural"
      },
      "properties": {
        "type": "object",
        "additionalProperties": false,
        "patternProperties": {
          "^": {
            "type": "string"
          }
        }
      }
    }
  },
  {
    "$id": "payload",
    "anyOf": [
      {
        "$ref": "bundle-payload"
      },
      {
        "$ref": "jump-payload"
      },
      {
        "$ref": "apply-payload"
      },
      {
        "$ref": "return-payload"
      },
      {
        "$ref": "throw-payload"
      },
      {
        "$ref": "await-payload"
      },
      {
        "$ref": "resolve-payload"
      },
      {
        "$ref": "reject-payload"
      },
      {
        "$ref": "yield-payload"
      },
      {
        "$ref": "resume-payload"
      },
      {
        "$ref": "query-payload"
      },
      {
        "$ref": "answer-payload"
      },
      {
        "$ref": "request-payload"
      },
      {
        "$ref": "response-payload"
      },
      {
        "$ref": "group-payload"
      },
      {
        "$ref": "ungroup-payload"
      }
    ]
  },
  {
    "$id": "bundle-payload",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "type"
    ],
    "properties": {
      "type": {
        "const": "bundle"
      }
    }
  },
  {
    "$id": "jump-payload",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "type"
    ],
    "properties": {
      "type": {
        "const": "jump"
      }
    }
  },
  {
    "$id": "apply-payload",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "type",
      "function",
      "this",
      "arguments"
    ],
    "properties": {
      "type": {
        "const": "apply"
      },
      "function": {
        "type": "string"
      },
      "this": {
        "$ref": "serial"
      },
      "arguments": {
        "type": "array",
        "items": {
          "$ref": "serial"
        }
      }
    }
  },
  {
    "$id": "return-payload",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "type",
      "function",
      "result"
    ],
    "properties": {
      "type": {
        "const": "return"
      },
      "function": {
        "type": "string"
      },
      "result": {
        "$ref": "serial"
      }
    }
  },
  {
    "$id": "throw-payload",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "type",
      "function",
      "error"
    ],
    "properties": {
      "type": {
        "const": "throw"
      },
      "function": {
        "type": "string"
      },
      "error": {
        "$ref": "serial"
      }
    }
  },
  {
    "$id": "await-payload",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "type",
      "promise"
    ],
    "properties": {
      "type": {
        "const": "await"
      },
      "promise": {
        "$ref": "serial"
      }
    }
  },
  {
    "$id": "resolve-payload",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "type",
      "result"
    ],
    "properties": {
      "type": {
        "const": "resolve"
      },
      "result": {
        "$ref": "serial"
      }
    }
  },
  {
    "$id": "reject-payload",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "type",
      "error"
    ],
    "properties": {
      "type": {
        "const": "reject"
      },
      "error": {
        "$ref": "serial"
      }
    }
  },
  {
    "$id": "yield-payload",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "type",
      "iterator"
    ],
    "properties": {
      "type": {
        "const": "yield"
      },
      "iterator": {
        "$ref": "serial"
      }
    }
  },
  {
    "$id": "resume-payload",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "type"
    ],
    "properties": {
      "type": {
        "const": "resume"
      }
    }
  },
  {
    "$id": "query-payload",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "type",
      "database",
      "version",
      "sql",
      "parameters"
    ],
    "properties": {
      "type": {
        "const": "query"
      },
      "database": {
        "type": "string",
        "nullable": true
      },
      "version": {
        "type": "string",
        "nullable": true
      },
      "sql": {
        "type": "string"
      },
      "parameters": {
        "anyOf": [
          {
            "type": "array",
            "items": {
              "$ref": "serial"
            }
          },
          {
            "type": "object",
            "additionalProperties": false,
            "patternProperties": {
              "^": {
                "$ref": "serial"
              }
            }
          }
        ]
      }
    }
  },
  {
    "$id": "answer-payload",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "type"
    ],
    "properties": {
      "type": {
        "const": "answer"
      }
    }
  },
  {
    "$id": "headers",
    "type": "object",
    "additionalProperties": false,
    "patternProperties": {
      "^": {
        "type": "string"
      }
    }
  },
  {
    "$id": "side",
    "enum": [
      "client",
      "server"
    ]
  },
  {
    "$id": "request-payload",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "type",
      "side",
      "protocol",
      "method",
      "url",
      "route",
      "headers",
      "body"
    ],
    "properties": {
      "type": {
        "const": "request"
      },
      "side": {
        "$ref": "side"
      },
      "protocol": {
        "type": "string"
      },
      "method": {
        "type": "string"
      },
      "url": {
        "type": "string"
      },
      "route": {
        "type": "string",
        "nullable": true
      },
      "headers": {
        "$ref": "headers"
      },
      "body": {
        "$ref": "serial"
      }
    }
  },
  {
    "$id": "response-payload",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "type",
      "side",
      "status",
      "message",
      "headers",
      "body"
    ],
    "properties": {
      "type": {
        "const": "response"
      },
      "side": {
        "$ref": "side"
      },
      "status": {
        "type": "integer"
      },
      "message": {
        "type": "string"
      },
      "headers": {
        "$ref": "headers"
      },
      "body": {
        "$ref": "serial"
      }
    }
  },
  {
    "$id": "group-payload",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "type",
      "group",
      "description"
    ],
    "properties": {
      "type": {
        "const": "group"
      },
      "group": {
        "$ref": "group"
      },
      "description": {
        "type": "string"
      }
    }
  },
  {
    "$id": "ungroup-payload",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "type",
      "group"
    ],
    "properties": {
      "type": {
        "const": "ungroup"
      },
      "group": {
        "$ref": "group"
      }
    }
  },
  {
    "$id": "message",
    "anyOf": [
      {
        "$ref": "start-message"
      },
      {
        "$ref": "stop-message"
      },
      {
        "$ref": "error-message"
      },
      {
        "$ref": "source-message"
      },
      {
        "$ref": "group-message"
      },
      {
        "$ref": "event-message"
      },
      {
        "$ref": "amend-message"
      }
    ]
  },
  {
    "$id": "source-map",
    "type": "object",
    "required": [
      "version",
      "sources",
      "names",
      "mappings"
    ],
    "properties": {
      "version": {
        "const": 3
      },
      "file": {
        "type": "string",
        "nullable": true
      },
      "sourceRoot": {
        "type": "string",
        "nullable": true
      },
      "sources": {
        "type": "array",
        "items": {
          "type": "string"
        }
      },
      "sourcesContent": {
        "type": "array",
        "nullable": true,
        "items": {
          "type": "string",
          "nullable": true
        }
      },
      "names": {
        "type": "array",
        "items": {
          "type": "string"
        }
      },
      "mappings": {
        "type": "string"
      }
    }
  }
];

const { Map: Map$a } = globalThis;

const { asTree } = Treeify__default["default"];

var validate$ajv = (dependencies) => {
  const {
    util: { assert, coalesce },
    expect: { expect },
  } = dependencies;
  const naming = new Map$a([
    ["serial", "serial"],
    ["payload", "payload"],
    ["external-configuration", "user-defined configuration"],
    ["internal-configuration", "internal configuration"],
    ["message", "message"],
    ["source-map", "source-map"],
  ]);
  const ajv = new Ajv__default["default"]({ verbose: true });
  ajv.addSchema(schema);
  const generateValidate = (name) => {
    const validateSchema = ajv.getSchema(name);
    return (json) => {
      if (!validateSchema(json)) {
        const { errors } = validateSchema;
        const { length } = errors;
        assert(length > 0, "unexpected empty error array");
        const tree1 = AjvErrorTree__default["default"].structureAJVErrorArray(errors);
        const tree2 = AjvErrorTree__default["default"].summarizeAJVErrorTree(tree1);
        expect(
          false,
          "invalid %s\n%s\n  Parameters = %j\n  Input = %j",
          naming.get(name),
          typeof tree2 === "string" ? tree2 : asTree(tree2, true),
          errors.map((error) => coalesce(error, "params", null)),
          json,
        );
      }
    };
  };
  return {
    validateSerial: generateValidate("serial"),
    validateMessage: generateValidate("message"),
    validatePayload: generateValidate("payload"),
    validateExternalConfiguration: generateValidate("external-configuration"),
    validateInternalConfiguration: generateValidate("internal-configuration"),
    validateSourceMap: generateValidate("source-map"),
  };
};

var validate_message$off = (dependencies) => {
  const {
    util: { noop },
  } = dependencies;
  return {
    validateMessage: noop,
  };
};

var validate_message$on = (dependencies) => {
  const {
    validate: { validateMessage },
  } = dependencies;
  return {
    validateMessage,
  };
};

// The following is cleaner:
const { platform: getPlatform } = OperatingSystem__default["default"];

const { encodeURIComponent, decodeURIComponent: decodeURIComponent$1 } = globalThis;

var path$node = (dependencies) => {
  const {
    util: { assert, constant, coalesce },
  } = dependencies;
  const makeComponent = ({
    getShell,
    ipc,
    separator,
    splitter,
    root,
    forbidden,
  }) => {
    const assertSegmentValidity = (segment) => {
      forbidden.lastIndex = 0;
      assert(!forbidden.test(segment), "invalid file name");
    };
    return {
      // TODO maybe we should rename path to platform to more accurate
      getShell,
      toIPCPath: (path) => `${ipc}${path}`,
      fromIPCPath: (path) => {
        assert(path.startsWith(ipc), "invalid ipc path");
        return path.substring(ipc.length);
      },
      makeSegment: (string, replace) => {
        forbidden.lastIndex = 0;
        return string.replace(forbidden, replace);
      },
      encodeSegment: (segment) => {
        assertSegmentValidity(segment);
        return encodeURIComponent(segment);
      },
      decodeSegment: (encoded_segment) => {
        const segment = decodeURIComponent$1(encoded_segment);
        assertSegmentValidity(segment);
        return segment;
      },
      joinPath: (segments) => segments.join(separator),
      splitPath: (path) => path.split(splitter),
      isAbsolutePath:
        typeof root === "string"
          ? (path) => path.startsWith(root)
          : (path) => root.test(path),
    };
  };
  if (getPlatform() === "win32") {
    return makeComponent({
      getShell: (env) => {
        const exec = coalesce(env, "comspec", "cmd.exe");
        return [
          exec,
          exec.endsWith("cmd") || exec.endsWith("cmd.exe") ? "/c" : "-c",
        ];
      },
      ipc: "\\\\.\\pipe\\",
      separator: "\\",
      splitter: /[\\/]/gu,
      root: /^([a-zA-Z]:[\\/]|[\\/][\\/])/u,
      forbidden: /[\u0000-\u001F\\/<>:"|?*]/gu,
    });
  } else {
    return makeComponent({
      getShell: constant(["/bin/sh", "-c"]),
      ipc: "",
      separator: "/",
      splitter: "/",
      root: "/",
      forbidden: /[\u0000/]/gu,
    });
  }
};

const { decodeURIComponent, URL: URL$6 } = globalThis;

var url$default = (dependencies) => {
  const {
    path: { encodeSegment, decodeSegment, splitPath, isAbsolutePath },
    expect: { expect },
  } = dependencies;

  const isNotEmptyString = (any) => any !== "";

  const getLastURLSegment = (url) => {
    const { pathname } = new URL$6(url);
    const encoded_segments = pathname.split("/");
    return decodeSegment(encoded_segments[encoded_segments.length - 1]);
  };

  const appendURLPathname = (url, pathname) => {
    const url_object = new URL$6(url);
    url_object.pathname += `${
      url_object.pathname.endsWith("/") ? "" : "/"
    }${pathname}`;
    return url_object.toString();
  };

  const setURLPathname = (url, pathname) => {
    const url_object = new URL$6(url);
    url_object.pathname = pathname;
    return url_object.toString();
  };

  const removeLastURLSegment = (url) => {
    const url_object = new URL$6(url);
    const segments = url_object.pathname.split("/");
    segments.pop();
    url_object.pathname = segments.join("/");
    return url_object.toString();
  };

  const appendURLSegment = (url, segment) =>
    appendURLPathname(url, encodeSegment(segment));

  const appendURLSegmentArray = (url, segments) =>
    appendURLPathname(url, segments.map(encodeSegment).join("/"));

  const getWindowsDrive = (pathname) =>
    /^\/[a-zA-Z]:/u.test(pathname) ? pathname[1] : null;

  // TODO: investigate whether is it worth detecting going to far into the
  // hiearchy of UNC paths. Normally the last two segments should remain
  // intact as ":C" file urls:
  // new URL("file:///C:/foo/../../").toString() >> 'file:///C:/'
  // new URL("file:////host/label/foo/../../").toString() >> 'file:////host/'
  //
  // Lets drop support for UNC file urls.
  // In node@14 file:////foo//bar is resolved as file:///foo//bar
  // So it seems that leading slashes are collpased on file urls.
  // This is not the case in node@16.
  //
  // const getUNCAddress = (pathname) => {
  //   const parts = /^(\/\/[^/]+\/[^/]+\/)/u.exec(pathname);
  //   return parts === null ? null : parts[1];
  // };
  // getUNCAddress(pathname) !== getUNCAddress(base_pathname)))

  const urlifyPath = (path, base_url) => {
    expect(
      !base_url.startsWith("data:"),
      "cannot transform path %j to a url based on data url %j",
      path,
      base_url,
    );
    const segments = splitPath(path);
    if (isAbsolutePath(path)) {
      if (segments[0].length === 2 && segments[0][1] === ":") {
        const root = segments.shift();
        return setURLPathname(
          base_url,
          [root, ...segments.map(encodeSegment)].join("/"),
        );
      } else {
        return setURLPathname(base_url, segments.map(encodeSegment).join("/"));
      }
    } else {
      return appendURLPathname(base_url, segments.map(encodeSegment).join("/"));
    }
  };

  const decodePathname = (pathname) => {
    if (getWindowsDrive(pathname) !== null) {
      pathname = pathname.substring(3);
    }
    return pathname.split("/").filter(isNotEmptyString).map(decodeSegment);
  };

  const pathifyURL = (url, base_url, dot_prefix = false) => {
    const { pathname, protocol, host } = new URL$6(url);
    const {
      pathname: base_pathname,
      protocol: base_protocol,
      host: base_host,
    } = new URL$6(base_url);
    if (
      protocol !== base_protocol ||
      host !== base_host ||
      (protocol === "file:" &&
        getWindowsDrive(pathname) !== getWindowsDrive(base_pathname))
    ) {
      return null;
    } else {
      const segments = decodePathname(pathname);
      const base_segments = decodePathname(base_pathname);
      while (
        segments.length > 0 &&
        base_segments.length > 0 &&
        decodeURIComponent(segments[0]) === decodeURIComponent(base_segments[0])
      ) {
        segments.shift();
        base_segments.shift();
      }
      while (base_segments.length > 0) {
        base_segments.pop();
        segments.unshift("..");
      }
      // This generated paths are sometimes given to node's `--require`.
      // And it relies on having explicit `.` or `..` in relative paths.
      if (segments.length === 0 || (dot_prefix && segments[0] !== "..")) {
        segments.unshift(".");
      }
      return segments.join("/");
    }
  };

  return {
    pathifyURL,
    urlifyPath,
    removeLastURLSegment,
    appendURLSegment,
    appendURLSegmentArray,
    getLastURLSegment,
  };
};

var validate_appmap$off = (dependencies) => {
  const {
    util: { noop },
  } = dependencies;
  return {
    validateAppmap: noop,
  };
};

const { validate: validateAppmap } = AppmapValidate__default["default"];

var validate_appmap$on = (dependencies) => {
  const {
    expect: { expectSuccess },
  } = dependencies;
  return {
    validateAppmap: (data) => {
      expectSuccess(
        () => validateAppmap(data, { version: "1.8.0" }),
        "failed to validate appmap\n%j\n%O",
        data,
      );
    },
  };
};

const {
  JSON: { parse: parseJSON$4, stringify: stringifyJSON$4 },
} = globalThis;

var location$default = (_dependencies) => ({
  makeLocation: (url, line, column) => ({ url, line, column }),
  stringifyLocation: stringifyJSON$4,
  parseLocation: parseJSON$4,
  getLocationFileURL: ({ url }) => url,
  incrementLocationColumn: ({ url, line, column }) => ({
    url,
    line,
    column: column + 1,
  }),
});

const { Error: Error$d, Map: Map$9, RegExp: RegExp$2 } = globalThis;

const { Minimatch: MinimatchClass } = Minimatch__default["default"];

var specifier$default = (dependencies) => {
  const {
    log: { logDebug },
    util: { assert },
    url: { pathifyURL },
    expect: { expectSuccess },
  } = dependencies;

  const regexps = new Map$9();

  const makeRegExp = (source, flags) => {
    const key = `/${source}/${flags}`;
    if (regexps.has(key)) {
      return regexps.get(key);
    } else {
      const regexp = expectSuccess(
        () => new RegExp$2(source, flags),
        "failed to compile regexp source = %j flags = %j >> %O",
        source,
        flags,
      );
      regexps.set(key, regexp);
      return regexp;
    }
  };

  const escape = (char) => `\\${char}`;

  const sanitizeForRegExp = (string) =>
    string.replace(/[/\\+*?.^$()[\]{}|]/gu, escape);

  // const sanitizeForGlob = (string) => string.replace(/[*?[\]]/g, escape);

  return {
    createSpecifier: (options, base) => {
      const { glob, path, dist, regexp, flags, recursive, external } = {
        glob: null,
        path: null,
        dist: null,
        regexp: null,
        flags: "",
        recursive: true,
        external: false,
        ...options,
      };
      if (regexp !== null) {
        return {
          base,
          source: regexp,
          flags,
        };
      }
      if (glob !== null) {
        const { source, flags } = new MinimatchClass(glob).makeRe();
        return {
          base,
          source,
          flags,
        };
      }
      if (path !== null) {
        assert(
          path[path.length - 1] !== "/",
          "directory path should not end with a path separator",
        );
        return {
          base,
          source: `^${sanitizeForRegExp(path)}($|/${
            recursive ? "" : "[^/]*$"
          })`,
          flags: "",
        };
      }
      if (dist !== null) {
        assert(
          dist[dist.length - 1] !== "/",
          "package path should not end with a path separator",
        );
        let source = `node_modules/${sanitizeForRegExp(dist)}/`;
        if (!external) {
          source = `^${source}`;
        }
        if (!recursive) {
          source = `${source}[^/]*$`;
        }
        return {
          base,
          source,
          flags: "",
        };
      }
      throw new Error$d("invalid specifier options");
    },
    matchSpecifier: (specifier, url) => {
      if (typeof specifier === "boolean") {
        logDebug(
          "url %j %s constant specifier",
          url,
          specifier ? "matched" : "did not match",
        );
        return specifier;
      } else {
        const { base, source, flags } = specifier;
        const maybe_path = pathifyURL(url, base);
        const matched =
          maybe_path === null
            ? false
            : makeRegExp(source, flags).test(maybe_path);
        logDebug(
          "url %j which resolves to %j relatively to %j %s regexp specifier %j with flags %j",
          url,
          maybe_path,
          base,
          matched ? "matched" : "did not match",
          source,
          flags,
        );
        return matched;
      }
    },
  };
};

const {
  Array: { isArray: isArray$1 },
  Reflect: { ownKeys: ownKeys$1 },
  Object: { entries: toEntries$2 },
} = globalThis;

const ANONYMOUS_NAME_SEPARATOR = "-";

const EXPECTED_EXTRA_PROPERTIES = ["test_recording"];

var configuration$default = (dependencies) => {
  const {
    log: { logGuardInfo },
    util: { hasOwnProperty, coalesce, identity },
    url: { urlifyPath },
    validate: { validateExternalConfiguration },
    specifier: { createSpecifier },
  } = dependencies;

  ////////////
  // Extend //
  ////////////

  const assign = (value1, value2) => ({ ...value1, ...value2 });

  const overwrite = (_value1, value2) => value2;

  // const append = (value1, value2) => [...value1, ...value2];

  const prepend = (value1, value2) => [...value2, ...value1];

  const extendCommandOptions = (options1, options2) => ({
    ...options1,
    ...options2,
    env: {
      ...coalesce(options1, "env", {}),
      ...coalesce(options2, "env", {}),
    },
  });

  ///////////////
  // Normalize //
  ///////////////

  const normalizeExclusion = (exclusion, _base) => {
    if (typeof exclusion === "string") {
      exclusion = {
        "qualified-name": exclusion,
        recursive: true,
      };
    }
    const default_value = coalesce(exclusion, "combinator", "and") === "and";
    return {
      combinator: "and",
      "qualified-name": default_value,
      name: default_value,
      "every-label": default_value,
      "some-label": default_value,
      excluded: true,
      recursive: false,
      ...exclusion,
    };
  };

  const normalizeHooks = (hooks, _base) => {
    if (hasOwnProperty(hooks, "eval")) {
      const { eval: whitelist } = hooks;
      return {
        ...hooks,
        eval:
          typeof whitelist === "boolean"
            ? whitelist
              ? ["eval"]
              : []
            : whitelist,
      };
    } else {
      return hooks;
    }
  };

  const normalizeExclude = (exclusions, _base) =>
    exclusions.map(normalizeExclusion);

  const normalizeCommand = (command, base) => ({
    base,
    script: typeof command === "string" ? command : null,
    tokens: typeof command === "string" ? null : command,
  });

  const normalizeScenarios = (scenarios, base) =>
    toEntries$2(scenarios).map(([key, value]) => ({
      base,
      key,
      value,
    }));

  const normalizeLog = (log, base) => {
    if (typeof log === "string") {
      log = { level: log };
    }
    if (hasOwnProperty(log, "file") && typeof log.file !== "number") {
      log.file = urlifyPath(log.file, base);
    }
    return log;
  };

  const normalizePort = (port, base) => {
    if (typeof port === "string" && port !== "") {
      port = urlifyPath(port, base);
    }
    return port;
  };

  const generateNormalizeSplit = (separator, key1, key2) => (value) => {
    if (typeof value === "string") {
      const segments = value.split(separator);
      return {
        [key1]: segments[0],
        [key2]: segments.length === 1 ? null : segments[1],
      };
    }
    return value;
  };

  const normalizeRecording = generateNormalizeSplit(
    ".",
    "defined-class",
    "method-id",
  );

  const normalizeFramework = generateNormalizeSplit("@", "name", "version");

  const normalizeFrameworkArray = (frameworks) =>
    frameworks.map(normalizeFramework);

  const normalizePackageSpecifier = (specifier, base) => {
    if (typeof specifier === "string") {
      specifier = { glob: specifier };
    }
    const {
      enabled,
      shallow,
      "inline-source": inline,
      exclude,
      ...rest
    } = {
      enabled: true,
      "inline-source": null,
      shallow: hasOwnProperty(specifier, "dist"),
      exclude: [],
      ...specifier,
    };
    return [
      createSpecifier(rest, base),
      {
        enabled,
        "inline-source": inline,
        shallow,
        exclude: exclude.map(normalizeExclusion),
      },
    ];
  };

  const normalizePackages = (specifiers, base) => {
    if (!isArray$1(specifiers)) {
      specifiers = [specifiers];
    }
    return specifiers.map((specifier) =>
      normalizePackageSpecifier(specifier, base),
    );
  };

  const normalizeProcessSpecifier = (specifier, base) => {
    if (typeof specifier === "string") {
      specifier = { glob: specifier };
    } else if (typeof specifier === "boolean") {
      specifier = { regexp: "^", flags: "u", enabled: specifier };
    }
    const { enabled, ...rest } = {
      enabled: true,
      ...specifier,
    };
    return [createSpecifier(rest, base), enabled];
  };

  const normalizeProcesses = (specifiers, base) => {
    if (!isArray$1(specifiers)) {
      specifiers = [specifiers];
    }
    return specifiers.map((specifier) =>
      normalizeProcessSpecifier(specifier, base),
    );
  };

  ////////////
  // fields //
  ////////////

  const fields = {
    socket: {
      extend: overwrite,
      normalize: identity,
    },
    heartbeat: {
      extend: overwrite,
      normalize: identity,
    },
    threshold: {
      extend: overwrite,
      normalize: identity,
    },
    agent: {
      extend: overwrite,
      normalize: identity,
    },
    repository: {
      extend: overwrite,
      normalize: identity,
    },
    scenario: {
      extend: overwrite,
      normalize: identity,
    },
    scenarios: {
      extend: overwrite,
      normalize: normalizeScenarios,
    },
    "recursive-process-recording": {
      extend: overwrite,
      normalize: identity,
    },
    command: {
      extend: overwrite,
      normalize: normalizeCommand,
    },
    "command-options": {
      extend: extendCommandOptions,
      normalize: identity,
    },
    validate: {
      extend: assign,
      normalize: identity,
    },
    log: {
      extend: assign,
      normalize: normalizeLog,
    },
    host: {
      extend: overwrite,
      normalize: identity,
    },
    session: {
      extend: overwrite,
      normalize: identity,
    },
    "trace-port": {
      extend: overwrite,
      normalize: normalizePort,
    },
    "trace-protocol": {
      extend: overwrite,
      normalize: identity,
    },
    "track-port": {
      extend: overwrite,
      normalize: normalizePort,
    },
    "track-protocol": {
      extend: overwrite,
      normalize: identity,
    },
    "intercept-track-port": {
      extend: overwrite,
      normalize: identity,
    },
    "intercept-track-protocol": {
      extend: overwrite,
      normalize: identity,
    },
    enabled: {
      extend: overwrite,
      normalize: identity,
    },
    processes: {
      extend: prepend,
      normalize: normalizeProcesses,
    },
    recorder: {
      extend: overwrite,
      normalize: identity,
    },
    "inline-source": {
      extend: overwrite,
      normalize: identity,
    },
    hooks: {
      extend: assign,
      normalize: normalizeHooks,
    },
    ordering: {
      extend: overwrite,
      normalize: identity,
    },
    "function-name-placeholder": {
      extend: overwrite,
      normalize: identity,
    },
    "collapse-package-hierachy": {
      extend: overwrite,
      normalize: identity,
    },
    serialization: {
      extend: assign,
      normalize: identity,
    },
    "hidden-identifier": {
      extend: overwrite,
      normalize: identity,
    },
    main: {
      extend: overwrite,
      normalize: urlifyPath,
    },
    language: {
      extend: overwrite,
      normalize: identity,
    },
    engine: {
      extend: overwrite,
      normalize: identity,
    },
    packages: {
      extend: prepend,
      normalize: normalizePackages,
    },
    exclude: {
      extend: prepend,
      normalize: normalizeExclude,
    },
    recording: {
      extend: overwrite,
      normalize: normalizeRecording,
    },
    appmap_dir: {
      extend: overwrite,
      normalize: urlifyPath,
    },
    appmap_file: {
      extend: overwrite,
      normalize: identity,
    },
    name: {
      extend: overwrite,
      normalize: identity,
    },
    "map-name": {
      extend: overwrite,
      normalize: identity,
    },
    pruning: {
      extend: overwrite,
      normalize: identity,
    },
    labels: {
      extend: prepend,
      normalize: identity,
    },
    feature: {
      extend: overwrite,
      normalize: identity,
      initial: null,
    },
    "feature-group": {
      extend: overwrite,
      normalize: identity,
    },
    frameworks: {
      extend: prepend,
      normalize: normalizeFrameworkArray,
    },
  };

  ////////////
  // export //
  ////////////

  return {
    createConfiguration: (home) => ({
      scenarios: [],
      scenario: "^",
      "recursive-process-recording": true,
      command: null,
      "command-options": {
        shell: null,
        encoding: "utf8",
        env: {},
        stdio: "inherit",
        timeout: 0,
        killSignal: "SIGTERM",
      },
      // overwritten by the agent
      agent: null,
      repository: {
        directory: home,
        history: null,
        package: null,
      },
      engine: null,
      labels: [],
      feature: null,
      "feature-group": null,
      frameworks: [],
      main: null,
      recording: null,
      // provided by the user
      socket: "unix",
      heartbeat: 1000,
      threshold: 100,
      host: "localhost",
      session: null,
      "trace-port": 0, // possibly overwritten by the agent
      "trace-protocol": "TCP",
      "track-port": 0, // possibly overwritten by the agent
      "track-protocol": "HTTP/1.1",
      "intercept-track-port": "^",
      "intercept-track-protocol": "HTTP/1.1",
      validate: {
        appmap: false,
        message: false,
      },
      log: {
        level: "error",
        file: 2,
      },
      appmap_dir: urlifyPath("tmp/appmap", home),
      appmap_file: null,
      processes: [[true, true]],
      recorder: null,
      "inline-source": false,
      hooks: {
        apply: true,
        eval: [],
        esm: true,
        cjs: true,
        http: true,
        mysql: true,
        sqlite3: true,
        pg: true,
      },
      ordering: "causal",
      "function-name-placeholder": "()",
      "collapse-package-hierachy": false,
      serialization: {
        "maximum-print-length": 100,
        "maximum-properties-length": 10,
        "impure-printing": true,
        "impure-constructor-naming": true,
        "impure-array-inspection": true,
        "impure-error-inspection": true,
        "impure-hash-inspection": true,
      },
      "hidden-identifier": "APPMAP",
      language: "javascript",
      packages: [
        [
          true,
          {
            enabled: false,
            shallow: false,
            exclude: [],
            "inline-source": null,
          },
        ],
      ],
      "anonymous-name-separator": ANONYMOUS_NAME_SEPARATOR,
      exclude: [
        {
          combinator: "or",
          name: `^[^${ANONYMOUS_NAME_SEPARATOR}]*$`,
          "qualified-name": false,
          "every-label": false,
          "some-label": "^",
          excluded: false,
          recursive: false,
        },
        {
          combinator: "or",
          name: true,
          "qualified-name": true,
          "every-label": true,
          "some-label": true,
          excluded: true,
          recursive: false,
        },
      ],
      pruning: true,
      name: null,
      "map-name": null,
    }),
    extendConfiguration: (
      internal_configuration,
      external_configuration,
      base,
    ) => {
      const extended_internal_configuration = { ...internal_configuration };
      validateExternalConfiguration(external_configuration);
      for (const key of ownKeys$1(external_configuration)) {
        if (hasOwnProperty(fields, key)) {
          const { normalize, extend } = fields[key];
          extended_internal_configuration[key] = extend(
            extended_internal_configuration[key],
            normalize(external_configuration[key], base),
          );
        } else {
          logGuardInfo(
            !EXPECTED_EXTRA_PROPERTIES.includes(key),
            "Configuration property not recognized by the agent: %j",
            key,
          );
        }
      }
      return extended_internal_configuration;
    },
  };
};

var Metadata = (dependencies) => {
  const {
    util: { assert, mapMaybe, recoverMaybe },
    url: { getLastURLSegment },
  } = dependencies;

  /* c8 ignore start */
  const getName = ({ name }) => name;

  const makeClient = (agent) => {
    if (agent === null) {
      agent = {
        directory: null,
        package: {
          name: "@appland/appmap-agent-js",
          version: "???",
          homepage: null,
        },
      };
    }
    const {
      package: { name, version, homepage },
    } = agent;
    return {
      name,
      version,
      url:
        homepage === null
          ? "https://github.com/applandinc/appmap-agent-js"
          : homepage,
    };
  };

  /* c8 ignore stop */

  const makeJustRecording = ({
    "defined-class": defined_class,
    "method-id": method_id,
  }) => ({
    defined_class,
    method_id,
  });

  const makeRecording = (recording) => mapMaybe(recording, makeJustRecording);

  const sanitizeHistory = ({ repository, branch, commit, ...rest }) => ({
    repository: recoverMaybe(repository, "APPMAP-MISSING-REPOSITORY-NAME"),
    branch: recoverMaybe(branch, "APPMAP-MISSING-REPOSITORY-BRANCH"),
    commit: recoverMaybe(commit, "APPMAP-MISSING-REPOSITORY-COMMIT"),
    ...rest,
  });

  const makeGit = ({ history }) => mapMaybe(history, sanitizeHistory);

  const makeAppName = (app_name, { package: _package }) =>
    app_name === null ? mapMaybe(_package, getName) : app_name;

  const makeMapName = (map_name, file_name, main) => {
    if (map_name !== null) {
      return map_name;
    }
    if (file_name !== null) {
      return file_name;
    }
    if (main !== null) {
      return getLastURLSegment(main).split(".")[0];
    }
    return null;
  };

  const makeTestStatus = (errors, status) => {
    const { length } = errors;
    return length === 0 && status === 0 ? "succeeded" : "failed";
  };

  const makeRecorder = (recorder) => {
    assert(recorder !== null, "recorder should have been resolved earlier");
    return { name: recorder };
  };

  const makeException = (errors) => {
    const { length } = errors;
    if (length === 0) {
      return null;
    } else {
      const [{ name, message }] = errors;
      return {
        class: recoverMaybe(name, "APPMAP-MISSING-ERROR-NAME"),
        message,
      };
    }
  };

  return {
    compileMetadata: (
      {
        name: app_name,
        "map-name": map_name,
        repository,
        labels,
        frameworks,
        language,
        engine,
        agent,
        main,
        appmap_file: file_name,
        recorder,
        recording,
      },
      errors,
      status,
    ) => ({
      name: makeMapName(map_name, file_name, main),
      app: makeAppName(app_name, repository),
      labels,
      language: {
        name: language,
        version: "ES.Next",
        engine,
      },
      frameworks,
      client: makeClient(agent),
      recorder: makeRecorder(recorder),
      recording: makeRecording(recording),
      git: makeGit(repository),
      test_status: makeTestStatus(errors, status),
      exception: makeException(errors),
    }),
  };
};

const { Error: Error$c } = globalThis;

const { parse: parseBabel } = BabelParser__default["default"];

var Parse = (dependencies) => {
  const {
    util: { coalesce },
    log: { logWarning, logError },
  } = dependencies;

  // const getPredecessorComment = (code, index, comments) => {
  //   index -= 1;
  //   while (index > 0) {
  //     if (comments.has(index)) {
  //       return comments.get(index);
  //     }
  //     if (!/^\p{Zs}$/u.test(code[index])) {
  //       break;
  //     }
  //     index -= 1;
  //   }
  //   return null;
  // };

  const printComment = ({ type, value }) => {
    if (type === "CommentBlock") {
      return `/*${value}*/`;
    }
    if (type === "CommentLine") {
      return `//${value}`;
    }
    /* c8 ignore start */
    throw new Error$c("invalid comment type");
    /* c8 ignore stop */
  };

  return {
    getLeadingCommentArray: (node) =>
      coalesce(node, "leadingComments", []).map(printComment),
    parse: (path, content) => {
      let source_type = "unambiguous";
      if (path.endsWith(".cjs") || path.endsWith(".node")) {
        source_type = "script";
      } else if (path.endsWith(".mjs")) {
        source_type = "module";
      }
      let plugins = [];
      if (path.endsWith(".ts") || path.endsWith(".tsx")) {
        plugins = ["typescript"];
      } else if (/^[ \t\n]*\/(\/[ \t]*|\*[ \t\n]*)@flow/u.test(content)) {
        plugins = ["flow"];
      }
      plugins.push("estree", "jsx");
      let result;
      try {
        result = parseBabel(content, {
          plugins,
          sourceType: source_type,
          errorRecovery: true,
          attachComment: true,
        });
      } catch (error) {
        logError("Unrecoverable parsing error at file %j >> %O", path, error);
        return { type: "Program", body: [], sourceType: "script" };
      }
      const { errors, program: node } = result;
      for (const error of errors) {
        logWarning("Recoverable parsing error at file %j >> %O", path, error);
      }
      return node;
    },
  };
};

const { Map: Map$8, String: String$2 } = globalThis;

var Naming = (dependencies) => {
  const {
    util: { incrementCounter },
  } = dependencies;

  const tags = new Map$8([
    ["ArrowFunctionExpression", "arrow"],
    ["FunctionExpression", "function"],
    ["FunctionDeclaration", "function"],
    ["ObjectExpression", "object"],
    ["ClassExpression", "class"],
    ["ClassDeclaration", "class"],
  ]);

  const getAnonymousName = ({ separator, counter }, { type }) =>
    `${tags.has(type) ? tags.get(type) : "unknown"}${separator}${String$2(
      incrementCounter(counter),
    )}`;

  return {
    getName: (naming, node, parent) => {
      if (
        (parent.type === "Property" || parent.type === "MethodDefinition") &&
        parent.value === node
      ) {
        return !parent.computed && parent.key.type === "Identifier"
          ? parent.key.name
          : getAnonymousName(naming, node);
      }
      if (node.type === "FunctionExpression" && node.id !== null) {
        return node.id.name;
      }
      if (
        node.type === "FunctionDeclaration" ||
        node.type === "ClassDeclaration"
      ) {
        return node.id === null ? "default" : node.id.name;
      }
      if (
        parent.type === "AssignmentExpression" &&
        parent.right === node &&
        parent.operator === "=" &&
        parent.left.type === "Identifier"
      ) {
        return parent.left.name;
      }
      if (
        parent.type === "VariableDeclarator" &&
        parent.init === node &&
        parent.id.type === "Identifier"
      ) {
        return parent.id.name;
      }
      return getAnonymousName(naming, node);
    },
  };
};

const {
  Reflect: { ownKeys },
  Array: { isArray },
} = globalThis;

var Visit = (dependencies) => {
  const {
    util: { assert, hasOwnProperty },
  } = dependencies;

  const trimStartString = (string) => string.trimStart();

  const extractLineLabel = (line) => {
    assert(line.startsWith("@label "), "invalid label line");
    const maybe_tokens = line.substring("@label".length).match(/\s+\S+/gu);
    return maybe_tokens === null ? [] : maybe_tokens.map(trimStartString);
  };

  const extractCommentLabelArray = (comment) => {
    const maybe_lines = comment.match(/@label .*/gu);
    return maybe_lines === null ? [] : maybe_lines.flatMap(extractLineLabel);
  };

  const { getName } = Naming(dependencies);

  const isMaybeNodeKey = (key) =>
    key !== "type" && key !== "loc" && key !== "start" && key !== "end";

  const concatResult = ({ head, body }) =>
    head === null ? body : [head, ...body];

  const visitBody = (nodes, parent, grand_parent, name, context) => {
    const head_children = [];
    const body_children = [];
    for (const node of nodes) {
      /* eslint-disable no-use-before-define */
      const { head, body } = visit(node, parent, grand_parent, context);
      /* eslint-enable no-use-before-define */
      if (head !== null) {
        head_children.push(head);
      }
      body_children.push(...body);
    }
    return {
      head: {
        type: "class",
        name,
        children: head_children,
      },
      body: body_children,
    };
  };

  const initial_parent = { type: "File" };
  const initial_grand_parent = { type: "Root" };

  // let depth = 0;
  // const visit = (node, ...args) => {
  //   depth += 1;
  //   console.log("*".repeat(depth), node && node.type);
  //   const result = visitInner(node, ...args);
  //   console.log("*".repeat(depth), JSON.stringify(result));
  //   depth -= 1;
  //   return result;
  // };

  const visit = (node, parent, grand_parent, context) => {
    if (isArray(node)) {
      return {
        head: null,
        body: node.flatMap((child) =>
          concatResult(visit(child, parent, grand_parent, context)),
        ),
      };
    }
    if (
      typeof node === "object" &&
      node !== null &&
      hasOwnProperty(node, "type")
    ) {
      const { type } = node;
      if (
        type === "FunctionExpression" ||
        type === "FunctionDeclaration" ||
        type === "ArrowFunctionExpression"
      ) {
        const {
          start,
          end,
          loc: {
            start: { line, column },
          },
        } = node;
        const { naming, getLeadingCommentArray } = context;
        const comments = getLeadingCommentArray(node);
        return {
          head: {
            type: "function",
            name: getName(naming, node, parent),
            children: [
              ...concatResult(visit(node.params, node, parent, context)),
              ...concatResult(visit(node.body, node, parent, context)),
            ],
            parameters: node.params.map(({ start, end }) => [start, end]),
            static: parent.type === "MethodDefinition" && parent.static,
            range: [start, end],
            line,
            column,
            comments,
            labels: comments.flatMap(extractCommentLabelArray),
          },
          body: [],
        };
      }
      if (
        type === "MethodDefinition" ||
        (type === "Property" && parent.type === "ObjectExpression")
      ) {
        const { head, body } = visit(node.value, node, parent, context);
        return {
          head,
          body: [
            ...concatResult(visit(node.key, node, parent, context)),
            ...body,
          ],
        };
      }
      if (type === "ObjectExpression") {
        const { naming } = context;
        return visitBody(
          node.properties,
          node,
          parent,
          getName(naming, node, parent),
          context,
        );
      }
      if (type === "ClassBody") {
        const { naming } = context;
        return visitBody(
          node.body,
          node,
          parent,
          getName(naming, parent, grand_parent),
          context,
        );
      }
      return {
        head: null,
        body: ownKeys(node)
          .filter(isMaybeNodeKey)
          .flatMap((key) =>
            concatResult(visit(node[key], node, parent, context)),
          ),
      };
    }
    return { head: null, body: [] };
  };

  return {
    visit: (node, context) =>
      concatResult(visit(node, initial_parent, initial_grand_parent, context)),
  };
};

var Estree = (dependencies) => {
  const { visit } = Visit(dependencies);
  const { parse, getLeadingCommentArray } = Parse(dependencies);
  return {
    extractEstreeEntityArray: (path, content, naming) =>
      visit(parse(path, content), {
        naming,
        getLeadingCommentArray,
      }),
  };
};

const {
  Error: Error$b,
  Map: Map$7,
  RegExp: RegExp$1,
  Array: { from: toArray$3 },
} = globalThis;

const cache = new Map$7();

var Exclusion = (dependencies) => {
  const {
    util: { generateGet },
  } = dependencies;

  const getQualifiedName = (entity, parent) => {
    if (entity.type === "class") {
      return entity.name;
    }
    if (entity.type === "function") {
      if (parent === null || parent.type === "function") {
        return entity.name;
      }
      if (parent.type === "class") {
        return `${parent.name}${entity.static ? "#" : "."}${entity.name}`;
      }
      throw new Error$b("getName called on invalid parent entity");
    }
    throw new Error$b("getName called on invalid entity");
  };
  const criteria = new Map$7([
    ["name", (pattern, { name }, _parent) => cache.get(pattern)(name)],
    [
      "qualified-name",
      (pattern, entity, parent) =>
        cache.get(pattern)(getQualifiedName(entity, parent)),
    ],
    [
      "some-label",
      (pattern, { type, labels }, _parent) =>
        type !== "function" || labels.some(cache.get(pattern)),
    ],
    [
      "every-label",
      (pattern, { type, labels }, _parent) =>
        type !== "function" || labels.every(cache.get(pattern)),
    ],
  ]);
  const criteria_name_array = toArray$3(criteria.keys());
  return {
    compileExclusion: (exclusion) => {
      for (const name of criteria_name_array) {
        const pattern = exclusion[name];
        if (typeof pattern === "string") {
          if (!cache.has(pattern)) {
            const regexp = new RegExp$1(pattern, "u");
            cache.set(pattern, (target) => regexp.test(target));
          }
        }
      }
      return exclusion;
    },
    isExclusionMatched: (exclusion, entity, parent) => {
      const isCriterionSatisfied = (name) => {
        const pattern = exclusion[name];
        if (typeof pattern === "boolean") {
          return pattern;
        }
        if (typeof pattern === "string") {
          return criteria.get(name)(pattern, entity, parent);
        }
        throw new Error$b("invalid pattern type");
      };
      if (exclusion.combinator === "and") {
        return criteria_name_array.every(isCriterionSatisfied);
      }
      if (exclusion.combinator === "or") {
        return criteria_name_array.some(isCriterionSatisfied);
      }
      throw new Error$b("invalid exclusion combinator");
    },
    isExcluded: generateGet("excluded"),
    isRecursivelyExclued: generateGet("recursive"),
  };
};

const { Error: Error$a } = globalThis;

var ExclusionList = (dependencies) => {
  const {
    compileExclusion,
    isExclusionMatched,
    isExcluded,
    isRecursivelyExclued,
  } = Exclusion(dependencies);
  return {
    compileExclusionList: (exclusions) => exclusions.map(compileExclusion),
    matchExclusionList: (exclusions, entity, parent) => {
      for (const exclusion of exclusions) {
        if (isExclusionMatched(exclusion, entity, parent)) {
          return {
            excluded: isExcluded(exclusion),
            recursive: isRecursivelyExclued(exclusion),
          };
        }
      }
      throw new Error$a("missing matched exclusion");
    },
  };
};

const {
  Set: Set$3,
  Map: Map$6,
  undefined: undefined$2,
  Array: { from: toArray$2 },
} = globalThis;

var Classmap = (dependencies) => {
  const {
    util: { assert, createCounter },
    url: { pathifyURL },
    log: { logWarning, logDebug },
    location: {
      makeLocation,
      parseLocation,
      stringifyLocation,
      incrementLocationColumn,
    },
  } = dependencies;
  const { compileExclusionList, matchExclusionList } =
    ExclusionList(dependencies);
  const printCommentArray = (comments) => {
    /* c8 ignore start */
    const { length } = comments;
    if (length === 0) {
      return null;
    }
    if (length === 1) {
      return comments[0];
    }
    return comments.join("\n");
    /* c8 ignore stop */
  };
  const { extractEstreeEntityArray } = Estree(dependencies);
  const generateCutContent =
    (content) =>
    ([start, end]) =>
      content.substring(start, end);
  const excludeEntity = (entity, parent, exclusions, excluded_entities) => {
    const { excluded, recursive } = matchExclusionList(
      exclusions,
      entity,
      parent,
    );
    if (excluded && recursive) {
      const exclude = (entity) => {
        excluded_entities.push(entity);
        entity.children.forEach(exclude);
      };
      exclude(entity);
      return [];
    }
    const children = entity.children.flatMap((child) =>
      excludeEntity(child, entity, exclusions, excluded_entities),
    );
    if (excluded && children.length === 0) {
      excluded_entities.push(entity);
      return [];
    }
    return [
      {
        ...entity,
        children,
      },
    ];
  };

  const registerEntityArray = (
    entities,
    { content, shallow, placeholder, path, url },
    closures,
  ) => {
    const cutContent = generateCutContent(content);
    const registerEntity = (entity) => {
      const { type, children } = entity;
      if (type === "function") {
        const { line, column, parameters, name, static: _static } = entity;
        closures.set(stringifyLocation(makeLocation(url, line, column)), {
          parameters: parameters.map(cutContent),
          shallow,
          link: {
            method_id: placeholder,
            path,
            lineno: line,
            defined_class: name,
            static: _static,
          },
        });
      }
      children.forEach(registerEntity);
    };
    entities.forEach(registerEntity);
  };

  const filterCalledEntityArray = (entities, { url }, callees) => {
    const filterCalledEntity = (entity) => {
      const children = entity.children.flatMap(filterCalledEntity);
      return entity.type === "function" &&
        children.length === 0 &&
        !callees.has(
          stringifyLocation(makeLocation(url, entity.line, entity.column)),
        ) &&
        !callees.has(
          stringifyLocation(makeLocation(url, entity.line, entity.column + 1)),
        ) &&
        !callees.has(
          stringifyLocation(makeLocation(url, entity.line, entity.column - 1)),
        )
        ? []
        : [
            {
              ...entity,
              children,
            },
          ];
    };
    return entities.flatMap(filterCalledEntity);
  };

  const cleanupEntity = (entity) => {
    const children = entity.children.flatMap(cleanupEntity);
    return entity.type === "function" || children.length > 0
      ? [{ ...entity, children }]
      : [];
  };

  const compileEntityArray = (
    entities,
    { placeholder, path, inline, content },
  ) => {
    const cutContent = generateCutContent(content);
    const compileEntity = (entity) =>
      entity.type === "function"
        ? {
            type: "class",
            name: entity.name,
            children: [
              {
                type: "function",
                name: placeholder,
                location: `${path}:${entity.line}`,
                static: entity.static,
                source: inline ? cutContent(entity.range) : null,
                comment: printCommentArray(entity.comments),
                labels: entity.labels,
              },
              ...entity.children.map(compileEntity),
            ],
          }
        : {
            ...entity,
            children: entity.children.map(compileEntity),
          };
    return entities.map(compileEntity);
  };

  return {
    createClassmap: (configuration) => ({
      closures: new Map$6(),
      sources: [],
      urls: new Set$3(),
      naming: {
        counter: createCounter(0),
        separator: "-",
      },
      configuration,
    }),
    addClassmapSource: (
      {
        closures,
        urls,
        naming,
        configuration: {
          pruning,
          "function-name-placeholder": placeholder,
          repository: { directory },
        },
        sources,
      },
      { url, content, inline, exclude, shallow },
    ) => {
      assert(!urls.has(url), "duplicate source url");
      urls.add(url);
      const path = pathifyURL(url, directory);
      const context = { url, path, shallow, inline, content, placeholder };
      const exclusions = compileExclusionList(exclude);
      const excluded_entities = [];
      let entities = extractEstreeEntityArray(path, content, naming).flatMap(
        (entity) => excludeEntity(entity, null, exclusions, excluded_entities),
      );
      for (const entity of excluded_entities) {
        const { type } = entity;
        if (type === "function") {
          const { line, column } = entity;
          closures.set(
            stringifyLocation(makeLocation(url, line, column)),
            null,
          );
        }
      }
      registerEntityArray(entities, context, closures);
      if (pruning) {
        entities = entities.flatMap(cleanupEntity);
      }
      sources.push({ context, entities });
    },
    getClassmapClosure: ({ closures }, location) => {
      if (closures.has(location)) {
        return closures.get(location);
      }
      const next_location = stringifyLocation(
        incrementLocationColumn(parseLocation(location)),
      );
      if (closures.has(next_location)) {
        logDebug(
          "Had to increase column by one to fetch closure information at %j",
          location,
        );
        return closures.get(next_location);
      }
      logWarning(
        "Missing file information for closure at %s, threating it as excluded.",
        location,
      );
      return null;
    },
    compileClassmap: (
      {
        sources,
        configuration: { pruning, "collapse-package-hierachy": collapse },
        closures,
      },
      locations,
    ) => {
      if (pruning) {
        locations = new Set$3(
          toArray$2(locations).map((location) =>
            closures.has(location)
              ? location
              : stringifyLocation(
                  incrementLocationColumn(parseLocation(location)),
                ),
          ),
        );
        sources = sources.map(({ context, entities }) => ({
          context,
          entities: filterCalledEntityArray(
            entities,
            context,
            locations,
          ).flatMap(cleanupEntity),
        }));
      }
      const directories = new Set$3();
      const root = [];
      if (collapse) {
        for (const { context, entities } of sources.values()) {
          if (
            /* c8 ignore start */ !pruning ||
            entities.length > 0 /* c8 ignore stop */
          ) {
            root.push({
              type: "package",
              name: context.path,
              children: compileEntityArray(entities, context),
            });
          }
        }
      } else {
        for (const { context, entities } of sources.values()) {
          if (
            /* c8 ignore start */ !pruning ||
            entities.length > 0 /* c8 ignore stop */
          ) {
            const dirnames = context.path.split("/");
            const filename = dirnames.pop();
            let children = root;
            for (const dirname of dirnames) {
              let child = children.find(
                (child) => child.name === dirname && directories.has(child),
              );
              if (child === undefined$2) {
                child = {
                  type: "package",
                  name: dirname,
                  children: [],
                };
                directories.add(child);
                children.push(child);
              }
              ({ children } = child);
            }
            children.push({
              type: "package",
              name: filename,
              children: compileEntityArray(entities, context),
            });
          }
        }
      }
      return root;
    },
  };
};

const { Error: Error$9, URL: URL$5, URLSearchParams, String: String$1, undefined: undefined$1 } = globalThis;

const {
  Object: { entries: toEntries$1 },
  Array: { from: arrayFrom },
} = globalThis;

var Payload = (dependencies) => {
  const {
    util: {
      assert,
      coalesceCaseInsensitive,
      zip,
      hasOwnProperty,
      mapMaybe,
      recoverMaybe,
    },
  } = dependencies;

  const parseURL = (url, headers) =>
    new URL$5(
      url[0] === "/"
        ? `http://${coalesceCaseInsensitive(
            headers,
            "host",
            "localhost",
          )}${url}`
        : url,
    );

  // const placeholder = {
  //   link: {
  //     defined_class: "MANUFACTURED_APPMAP_CLASS",
  //     lineno: 0,
  //     method_id: "MANUFACTURED_APPMAP_METHOD",
  //     static: false,
  //     path: "MANUFACTURED_APPMAP_FILE.js",
  //   },
  //   parameters: [],
  // };

  const isFirstColon = ([string]) => string.startsWith(":");

  const digestSearchMessage = (search) =>
    arrayFrom(new URLSearchParams(search).entries());

  const digestParameterPrimitive = (name, primitive) => ({
    name,
    class: typeof primitive,
    object_id: null,
    value: String$1(primitive),
  });

  const digestParameterPrimitiveTuple = ([name, primitive]) =>
    digestParameterPrimitive(name, primitive);

  const digestSpecificHashEntry = ([key, value]) => ({
    name: key,
    class: value,
  });

  const digestSpecific = (specific) => {
    if (specific === null) {
      return null;
    } else if (specific.type === "array") {
      return { size: specific.length };
    } else if (specific.type === "hash") {
      return {
        size: specific.length,
        properties: toEntries$1(specific.properties).map(digestSpecificHashEntry),
      };
    } else {
      return null;
    }
  };

  const digestParameterSerial = (name, serial) => {
    if (serial.type === "object" || serial.type === "function") {
      return {
        name,
        class: serial.constructor,
        object_id: serial.index,
        value: serial.print,
        ...digestSpecific(serial.specific),
      };
    } else {
      return {
        name,
        class: serial.type,
        object_id: serial.type === "symbol" ? serial.index : null,
        value: serial.print,
      };
    }
  };

  const digestParameterSerialReturn = (serial) =>
    digestParameterSerial("return", serial);

  const digestParameterSerialTuple = ([name, serial]) =>
    digestParameterSerial(name, serial);

  const extractErrorSpecific = (specific) =>
    specific !== null && specific.type === "error"
      ? specific
      : { message: null, stack: null };

  const digestExceptionSerial = (serial) => {
    if (serial.type === "object" || serial.type === "function") {
      const { message, stack } = extractErrorSpecific(serial.specific);
      return {
        class: serial.constructor,
        message: recoverMaybe(message, serial.print),
        object_id: serial.index,
        // TODO: extract path from stack
        path: stack,
        // TODO: extract line number from stack
        lineno: null,
      };
    } else {
      return {
        class: serial.type,
        message: serial.print,
        object_id: serial.type === "symbol" ? serial.index : 0,
        path: null,
        lineno: null,
      };
    }
  };

  const digesters = {
    // function //
    apply: ({ this: _this, arguments: _arguments }, { link, parameters }) => ({
      ...link,
      // TODO: It would make more sense to allow receiver to be null.
      // receiver: mapMaybe(this, digestParameterSerialThis),
      receiver:
        _this === null
          ? digestParameterPrimitive("this", undefined$1)
          : digestParameterSerial("this", _this),
      parameters: zip(parameters, _arguments).map(digestParameterSerialTuple),
    }),
    return: ({ result }, _options) => ({
      return_value: digestParameterSerial("return", result),
      exceptions: null,
    }),
    throw: ({ error }, _options) => ({
      return_value: null,
      exceptions: [digestExceptionSerial(error)],
    }),
    // http //
    request: ({ side, protocol, method, url, headers, route }, _options) => {
      const { origin, pathname, search } = parseURL(url, headers);
      if (side === "server") {
        return {
          http_server_request: {
            protocol,
            request_method: method,
            path_info: pathname,
            normalized_path_info: route,
            headers,
          },
          message: [
            ...(route === null
              ? []
              : zip(route.split("/"), pathname.split("/")).filter(
                  isFirstColon,
                )),
            ...digestSearchMessage(search),
          ].map(digestParameterPrimitiveTuple),
        };
      } else if (side === "client") {
        return {
          http_client_request: {
            request_method: method,
            url: `${origin}${pathname}`,
            headers,
          },
          message: digestSearchMessage(search).map(
            digestParameterPrimitiveTuple,
          ),
        };
      } /* c8 ignore start */ else {
        throw new Error$9("invalid request side");
      } /* c8 ignore stop */
    },
    response: ({ side, status, headers, body }, _options) => ({
      [`http_${side}_response`]: {
        status_code: status,
        headers,
        return_value: mapMaybe(body, digestParameterSerialReturn),
      },
    }),
    // sql //
    query: ({ database, version, sql, parameters }, _options) => ({
      sql_query: {
        database_type: database,
        server_version: version,
        sql,
        explain_sql: null,
      },
      message: toEntries$1(parameters).map(digestParameterSerialTuple),
    }),
    answer: ({}, _options) => ({}),
  };

  const digestPayload = (payload, options) => {
    const { type } = payload;
    assert(hasOwnProperty(digesters, type), "cannot digest payload");
    return digesters[type](payload, options);
  };

  return {
    digestParameterPrimitive, // export for testing
    digestParameterSerial, // export for testing
    digestExceptionSerial, // export for testing
    digestPayload,
  };
};

const { Error: Error$8 } = globalThis;

var Event = (dependencies) => {
  const {
    util: { mapMaybe, createCounter, incrementCounter },
  } = dependencies;
  const { getClassmapClosure } = Classmap(dependencies);
  const { digestPayload } = Payload(dependencies);

  const digestEventPair = (event1, event2, id1, id2, info) => [
    {
      event: "call",
      thread_id: 0,
      id: id1,
      ...digestPayload(event1.payload, info),
    },
    {
      event: "return",
      thread_id: 0,
      id: id2,
      parent_id: id1,
      elapsed: (event2.time - event1.time) / 1000,
      ...digestPayload(event2.payload, info),
    },
  ];

  const digestEventTrace = (root, classmap) => {
    const counter = createCounter(0);
    const getClosureInfo = (location) => getClassmapClosure(classmap, location);
    /* eslint-disable no-use-before-define */
    const digestTransparentBundle = ({ children }, _info) =>
      children.flatMap(loop);
    /* eslint-enable no-use-before-define */
    const digestShallowBundle = ({ begin, end }, info) =>
      digestEventPair(
        begin,
        end,
        incrementCounter(counter),
        incrementCounter(counter),
        info,
      );
    /* eslint-disable no-use-before-define */
    const digestDeepBundle = ({ begin, children, end }, info) => {
      const id1 = incrementCounter(counter);
      const digest = children.flatMap(loop);
      const id2 = incrementCounter(counter);
      const [event1, event2] = digestEventPair(begin, end, id1, id2, info);
      digest.unshift(event1);
      digest.push(event2);
      return digest;
    };
    /* eslint-enable no-use-before-define */
    const loop = (node) => {
      if (node.type === "bundle") {
        const {
          begin: {
            payload: { type },
          },
        } = node;
        if (type === "bundle" || type === "group") {
          return digestTransparentBundle(node);
        } else if (type === "apply") {
          const info = mapMaybe(node.begin.payload.function, getClosureInfo);
          if (info === null) {
            return digestTransparentBundle(node);
          } else if (info.shallow) {
            return digestShallowBundle(node, info);
          } else {
            return digestDeepBundle(node, info);
          }
        } else {
          return digestDeepBundle(node, null);
        }
      } else if (node.type === "jump") {
        const { before, after } = node;
        const {
          payload: { type },
        } = before;
        if (type === "jump" || type === "await" || type === "yield") {
          return [];
        } else {
          return digestEventPair(
            before,
            after,
            incrementCounter(counter),
            incrementCounter(counter),
            null,
          );
        }
      } /* c8 ignore start */ else {
        throw new Error$8("invalid node type");
      } /* c8 ignore stop */
    };
    return root.flatMap(loop);
  };

  return { digestEventTrace };
};

// Resolve groups.
// Each top-level tree is associated to a group.
// These trees are inserted into their corresponding group/ungroup event pair.
// NB: group/ungroup event pairs appear when asynchronous ressources are registered.

const {
  Array: { from: toArray$1 },
  Map: Map$5,
} = globalThis;

var Group = (_dependencies) => {
  const makeFrame = (enter, children, leave) => ({ enter, children, leave });

  const takeMap = (map, key) => {
    const value = map.get(key);
    map.delete(key);
    return value;
  };

  const groupStack = (root) => {
    const groups2 = new Map$5();
    const groups1 = new Map$5();
    for (const node of root) {
      const {
        enter: { group },
      } = node;
      if (groups1.has(group)) {
        groups1.get(group).push(node);
      } else {
        groups1.set(group, [node]);
      }
    }
    const mapping = ({ enter, children, leave }) => {
      children = children.map(mapping);
      if (enter.site === "begin" && enter.payload.type === "group") {
        const {
          payload: { group },
        } = enter;
        if (groups1.has(group)) {
          for (const async_child of takeMap(groups1, group)) {
            children.push(mapping(async_child));
          }
        } else if (groups2.has(group)) {
          for (const async_child of takeMap(groups2, group)) {
            children.push(async_child);
          }
        }
      }
      return makeFrame(enter, children, leave);
    };
    for (const group of groups1.keys()) {
      groups2.set(group, takeMap(groups1, group).map(mapping));
    }
    return toArray$1(groups2.values()).flat(1);
  };

  return { groupStack };
};

// Rearrenge the event trace into an array of trees.
// These trees are made by bookkeeping a stack:
//   - begin/after events trigger a push
//   - end/before events trigger a pop
// Missing events at the beginning or at the end of the trace are manufactured to complete the first and last tree.

const { Error: Error$7 } = globalThis;

var Stack = (dependencies) => {
  const {
    util: { createCounter, incrementCounter },
  } = dependencies;

  const makeFrame = (enter, children, leave) => ({ enter, children, leave });

  const getCurrentFrameArray = (frames, stack) =>
    stack.length === 0 ? frames : stack[stack.length - 1].children;

  const createJumpEvent = (site, tab, group, time) => ({
    type: "event",
    site,
    tab,
    group,
    time,
    payload: {
      type: "jump",
    },
  });

  const stackify = (events) => {
    let root = [];
    const stack = [];
    let max = 0;
    for (const event of events) {
      if (event.tab > max) {
        max = event.tab;
      }
    }
    const counter = createCounter(max);
    for (const event of events) {
      if (event.site === "begin" || event.site === "after") {
        stack.push(makeFrame(event, [], null));
      } else if (event.site === "end" || event.site === "before") {
        if (stack.length > 0) {
          const frame = stack.pop();
          frame.leave = event;
          getCurrentFrameArray(root, stack).push(frame);
        } else {
          root = [
            makeFrame(
              createJumpEvent(
                "after",
                incrementCounter(counter),
                event.group,
                event.time,
              ),
              root,
              event,
            ),
          ];
        }
      } /* c8 ignore start */ else {
        throw new Error$7("invalid event site");
      } /* c8 ignore stop */
    }
    while (stack.length > 0) {
      const frame = stack.pop();
      frame.leave = createJumpEvent(
        "before",
        incrementCounter(counter),
        frame.enter.group,
        frame.enter.time,
      );
      getCurrentFrameArray(root, stack).push(frame);
    }
    return root;
  };

  return { stackify };
};

const { Error: Error$6 } = globalThis;

var Matching = (_dependencies) => {
  const payloads = {
    jump: {
      type: "jump",
    },
    bundle: {
      type: "bundle",
    },
    apply: {
      type: "apply",
      function: null,
      this: {
        type: "string",
        print: "APPMAP-APPLY",
      },
      arguments: [],
    },
    return: {
      type: "return",
      function: null,
      result: {
        type: "string",
        print: "APPMAP-RETURN",
      },
    },
    throw: {
      type: "throw",
      function: null,
      error: {
        type: "string",
        print: "APPMAP-THROW",
      },
    },
    request: {
      side: null,
      type: "request",
      protocol: "HTTP/1.1",
      method: "GET",
      path: "/APPMAP/REQUEST",
      route: null,
      headers: {},
      body: null,
    },
    response: {
      side: null,
      type: "response",
      status: 200,
      message: "APPMAP-RESPONSE",
      route: null,
      headers: {},
      body: null,
    },
    query: {
      type: "query",
      database: "",
      version: null,
      sql: "SELECT * FROM APPMAP-QUERY;",
    },
    answer: {
      type: "answer",
      error: null,
    },
    yield: {
      type: "yield",
      function: null,
      delegate: false,
      iterator: {
        type: "string",
        print: "APPMAP-YIELD",
      },
    },
    resume: {
      type: "resume",
      function: null,
    },
    await: {
      type: "await",
      function: null,
      promise: {
        type: "string",
        print: "APPMAP-AWAIT",
      },
    },
    resolve: {
      type: "resolve",
      function: null,
      result: {
        type: "APPMAP-RESOLVE",
      },
    },
    reject: {
      type: "reject",
      function: null,
      error: {
        type: "APPMAP-REJECT",
      },
    },
    group: {
      type: "group",
      group: null,
      description: "MISSING",
    },
    ungroup: {
      type: "ungroup",
      group: null,
    },
  };

  const matching = [
    ["begin/bundle", "end/bundle", []],
    ["begin/apply", "end/return", ["function"]],
    ["begin/apply", "end/throw", ["function"]],
    ["begin/request", "end/response", ["side"]],
    ["begin/group", "end/ungroup", ["group"]],
    ["before/await", "after/resolve", ["function"]],
    ["before/await", "after/reject", ["function"]],
    ["before/yield", "after/resume", ["function"]],
    ["before/jump", "after/jump", []],
    ["before/request", "after/response", ["side"]],
    ["before/query", "after/answer", []],
  ];

  const makeKey = ({ site, payload: { type } }) => `${site}/${type}`;

  const makeMatch = (key, copying) => {
    const [site, type] = key.split("/");
    return { site, type, copying };
  };

  const matchFirst = (event) => {
    const key = makeKey(event);
    for (const match of matching) {
      if (match[0] === key) {
        return makeMatch(match[1], match[2]);
      } else if (match[1] === key) {
        return makeMatch(match[0], match[2]);
      }
    }
    throw new Error$6("invalid combination of event site and event payload type");
  };

  const manufactureMatchingEvent = (event) => {
    const { site, type, copying } = matchFirst(event);
    const payload = { ...payloads[type] };
    for (const field of copying) {
      payload[field] = event.payload[field];
    }
    return {
      type: "event",
      site,
      tab: event.tab,
      time: event.time,
      group: event.group,
      payload,
    };
  };

  const isMatchingEvent = (event1, event2) => {
    const key1 = makeKey(event1);
    const key2 = makeKey(event2);
    for (const match of matching) {
      if (match[0] === key1 && match[1] === key2) {
        for (const field of match[2]) {
          if (event1.payload[field] !== event2.payload[field]) {
            return false;
          }
        }
        return event1.tab === event2.tab;
      }
    }
    return false;
  };

  return {
    manufactureMatchingEvent,
    isMatchingEvent,
  };
};

// Resolve jumps.

const {
  Array: { from: toArray },
  Error: Error$5,
  Map: Map$4,
} = globalThis;

var Jump = (dependencies) => {
  const {
    util: { assert },
  } = dependencies;

  const { manufactureMatchingEvent, isMatchingEvent } = Matching();

  const manufactureBundleEvent = (site, tab) => ({
    type: "event",
    site,
    tab,
    group: 0,
    time: 0,
    payload: {
      type: "bundle",
    },
  });

  const makeBundleNode = (begin, children, end) => {
    assert(isMatchingEvent(begin, end), "begin/end event mismatch");
    return {
      type: "bundle",
      begin,
      children,
      end,
    };
  };

  const makeJumpNode = (before, after) => {
    assert(isMatchingEvent(before, after), "before/after event mismatch");
    return {
      type: "jump",
      before,
      after,
    };
  };

  const makeFrame = (enter, children, leave) => ({ enter, children, leave });

  const makeOrphan = (open, children, close) => ({
    open,
    children,
    close,
  });

  const manufactureBundleNode = (orphan) => {
    if (orphan.open.site === "begin" && orphan.close.site === "end") {
      return makeBundleNode(orphan.open, orphan.children, orphan.close);
    } else if (orphan.open.site === "after" && orphan.close.site === "before") {
      return makeBundleNode(
        manufactureBundleEvent("begin", 0),
        [
          makeJumpNode(manufactureMatchingEvent(orphan.open), orphan.open),
          ...orphan.children,
          makeJumpNode(orphan.close, manufactureMatchingEvent(orphan.close)),
        ],
        manufactureBundleEvent("end", 0),
      );
    } else if (orphan.open.site === "after" && orphan.close.site === "end") {
      return makeBundleNode(
        manufactureMatchingEvent(orphan.close),
        [
          makeJumpNode(manufactureMatchingEvent(orphan.open), orphan.open),
          ...orphan.children,
        ],
        orphan.close,
      );
    } else if (orphan.open.site === "begin" && orphan.close.site === "before") {
      return makeBundleNode(
        orphan.open,
        [
          ...orphan.children,
          makeJumpNode(orphan.close, manufactureMatchingEvent(orphan.close)),
        ],
        manufactureMatchingEvent(orphan.open),
      );
    } /* c8 ignore start */ else {
      throw new Error$5("invalid enter/leave event site");
    } /* c8 ignore stop */
  };

  const splitJump = (frames, jumps) => {
    const filtering = (frame) => {
      if (frame.enter.site === "after") {
        assert(!jumps.has(frame.enter.tab), "duplicate jump");
        jumps.set(frame.enter.tab, frame);
        return false;
      } else {
        return true;
      }
    };
    const mapping = (frame) =>
      makeFrame(
        frame.enter,
        frame.children.map(mapping).filter(filtering),
        frame.leave,
      );
    return frames.map(mapping).filter(filtering);
  };

  const joinJump = (frames, jumps) => {
    /* eslint-disable no-use-before-define */
    const mapBeginFrame = (frame) => manufactureBundleNode(mapFrame(frame));
    /* eslint-enable no-use-before-define */
    const orphans = new Map$4();
    const mapFrame = (frame) => {
      const open = frame.enter;
      const nodes = frame.children.map(mapBeginFrame);
      let close = frame.leave;
      while (close.site === "before") {
        if (jumps.has(close.tab)) {
          const frame = jumps.get(close.tab);
          jumps.delete(close.tab);
          nodes.push(makeJumpNode(close, frame.enter));
          nodes.push(...frame.children.map(mapBeginFrame));
          close = frame.leave;
        } else if (orphans.has(close.tab)) {
          const orphan = orphans.get(close.tab);
          orphans.delete(close.tab);
          nodes.push(makeJumpNode(close, orphan.open));
          nodes.push(...orphan.children);
          close = orphan.close;
        } else {
          return makeOrphan(open, nodes, close);
        }
      }
      return makeOrphan(open, nodes, close);
    };
    const nodes = frames.map(mapBeginFrame);
    for (const tab of jumps.keys()) {
      const frame = jumps.get(tab);
      jumps.delete(tab);
      orphans.set(tab, mapFrame(frame));
    }
    return [].concat(
      toArray(orphans.values()).map(manufactureBundleNode),
      nodes,
    );
  };

  const jumpify = (root) => {
    const jumps = new Map$4();
    return joinJump(splitJump(root, jumps), jumps);
  };

  return {
    jumpify,
  };
};

// Beware, event ordering is by far the most difficult code to understand.

var Ordering = (dependencies) => {
  const { stackify } = Stack(dependencies);
  const { groupStack } = Group();
  const { jumpify } = Jump(dependencies);
  return {
    orderEventArray: (events) => jumpify(groupStack(stackify(events))),
  };
};

const { Error: Error$4, Set: Set$2 } = globalThis;

const VERSION = "1.8.0";

var trace$appmap = (dependencies) => {
  const {
    util: { hasOwnProperty },
    log: { logDebug },
    "validate-appmap": { validateAppmap },
    configuration: { extendConfiguration },
  } = dependencies;
  const { compileMetadata } = Metadata(dependencies);
  const { createClassmap, addClassmapSource, compileClassmap } =
    Classmap(dependencies);
  const { orderEventArray } = Ordering(dependencies);
  const { digestEventTrace } = Event(dependencies);
  return {
    compileTrace: (configuration, messages) => {
      logDebug(
        "Trace:\n  configuration = %j\n  messages = %j",
        configuration,
        messages,
      );
      const sources = [];
      const errors = [];
      const events = [];
      let status = 0;
      for (const message of messages) {
        const { type } = message;
        if (type === "start") {
          configuration = extendConfiguration(
            configuration,
            message.configuration,
            message.url,
          );
        } else if (type === "stop") {
          status = message.status;
        } else if (type === "error") {
          errors.push(message);
        } else if (type === "event") {
          events.push(message);
        } else if (type === "group") {
          events.push(
            {
              type: "event",
              site: "begin",
              tab: 0,
              group: message.group,
              time: 0,
              payload: {
                type: "group",
                group: message.child,
                description: message.description,
              },
            },
            {
              type: "event",
              site: "end",
              tab: 0,
              group: message.group,
              time: 0,
              payload: {
                type: "ungroup",
                group: message.child,
              },
            },
          );
        } else if (type === "source") {
          sources.push(message);
        } else if (type === "amend") {
          for (let index = events.length - 1; index >= 0; index -= 1) {
            const event = events[index];
            if (event.tab === message.tab && event.site === message.site) {
              events[index] = { ...event, payload: message.payload };
              break;
            }
          }
        } /* c8 ignore start */ else {
          throw new Error$4("invalid message type");
        } /* c8 ignore stop */
      }
      const classmap = createClassmap(configuration);
      for (const source of sources) {
        addClassmapSource(classmap, source);
      }
      const routes = new Set$2();
      for (const event of events) {
        if (hasOwnProperty(event.payload, "function")) {
          routes.add(event.payload.function);
        }
      }
      const appmap = {
        version: VERSION,
        metadata: compileMetadata(configuration, errors, status),
        classMap: compileClassmap(classmap, routes),
        events: digestEventTrace(orderEventArray(events), classmap),
      };
      validateAppmap(appmap);
      return {
        head: configuration,
        body: appmap,
      };
    },
  };
};

const { Map: Map$3 } = globalThis;

var backend$default = (dependencies) => {
  const {
    util: { assert },
    log: { logDebug },
    "validate-message": { validateMessage },
    trace: { compileTrace },
  } = dependencies;
  return {
    createBackend: (configuration) => ({
      configuration,
      sources: [],
      tracks: new Map$3(),
      traces: new Map$3(),
    }),
    getBackendTrackIterator: ({ tracks }) => tracks.keys(),
    getBackendTraceIterator: ({ traces }) => traces.keys(),
    hasBackendTrack: ({ tracks }, key) => tracks.has(key),
    hasBackendTrace: ({ traces }, key) => traces.has(key),
    takeBackendTrace: ({ traces }, key) => {
      assert(traces.has(key), "missing trace");
      const trace = traces.get(key);
      traces.delete(key);
      return trace;
    },
    sendBackend: ({ configuration, sources, tracks, traces }, message) => {
      validateMessage(message);
      logDebug("message >> %j", message);
      const { type } = message;
      if (type === "start") {
        const { track: key } = message;
        assert(!tracks.has(key), "duplicate track");
        tracks.set(key, [...sources, message]);
      } else if (type === "stop") {
        const { track: key } = message;
        assert(tracks.has(key), "missing track");
        assert(!traces.has(key), "duplicate trace");
        const messages = tracks.get(key);
        messages.push(message);
        tracks.delete(key);
        traces.set(key, compileTrace(configuration, messages));
      } else {
        if (type === "source") {
          sources.push(message);
        }
        for (const messages of tracks.values()) {
          messages.push(message);
        }
      }
    },
  };
};

const { process } = globalThis;

var spawn$node = (_dependencies) => ({
  spawn: (exec, argv, options) =>
    child_process.spawn(exec, argv, {
      ...options,
      cwd: "cwd" in options ? url.fileURLToPath(options.cwd) : process.cwd(),
    }),
});

const { URL: URL$4, parseInt } = globalThis;

var Git = (dependencies) => {
  const {
    expect: { expect, expectSuccess },
    log: { logWarning },
    util: { mapMaybe, coalesce },
  } = dependencies;

  const trim = (string) => string.trim();

  const run = (command, url$1) => {
    const result = child_process.spawnSync(
      command.split(" ")[0],
      command.split(" ").slice(1),
      {
        cwd: url.fileURLToPath(url$1),
        encoding: "utf8",
        timeout: 1000,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    const error = coalesce(result, "error", null);
    expect(
      error === null,
      `command %j on cwd %j threw an error >> %O`,
      command,
      url$1,
      error || { message: "dummy" },
    );
    const { signal, status, stdout, stderr } = result;
    expect(
      signal === null,
      `command %j on cwd %j was killed with %j`,
      command,
      url$1,
      signal,
    );
    if (status === 0) {
      return stdout.trim();
    }
    /* c8 ignore start */
    logWarning(
      `command %j on cwd %j failed with %j >> %s`,
      command,
      url$1,
      status,
      stderr,
    );
    return null;
    /* c8 ignore stop */
  };

  const parseStatus = (stdout) => stdout.split("\n").map(trim);

  const parseDescription = (stdout) => {
    const parts = /^([^-]*)-([0-9]+)-/u.exec(stdout);
    /* c8 ignore start */
    if (parts === null) {
      logWarning("Failed to parse git description %j", stdout);
      return 0;
    }
    /* c8 ignore stop */
    return parseInt(parts[2], 10);
  };

  return {
    extractGitInformation: (url) => {
      if (
        !expectSuccess(
          () => fs.readdirSync(new URL$4(url)),
          "could not read repository directory %j >> %O",
          url,
        ).includes(".git")
      ) {
        logWarning("Repository directory %j is not a git directory", url);
        return null;
      }
      return {
        repository: run(`git config --get remote.origin.url`, url),
        branch: run(`git rev-parse --abbrev-ref HEAD`, url),
        commit: run(`git rev-parse HEAD`, url),
        status: mapMaybe(run(`git status --porcelain`, url), parseStatus),
        tag: run(`git describe --abbrev=0 --tags`, url),
        annotated_tag: run(`git describe --abbrev=0`, url),
        commits_since_tag: mapMaybe(
          run(`git describe --long --tags`, url),
          parseDescription,
        ),
        commits_since_annotated_tag: mapMaybe(
          run(`git describe --long`, url),
          parseDescription,
        ),
      };
    },
  };
};

const {
  URL: URL$3,
  JSON: { parse: parseJSON$3 },
} = globalThis;

var repository$node = (dependencies) => {
  const {
    expect: { expectSuccess, expect },
    url: { appendURLSegment },
    log: { logWarning },
  } = dependencies;
  const { extractGitInformation } = Git(dependencies);
  const hasPackageJSON = (url) => {
    try {
      fs.readFileSync(new URL$3(appendURLSegment(url, "package.json")), "utf8");
      return true;
    } catch (error) {
      const { code } = { code: null, ...error };
      expect(
        code === "ENOENT",
        "failed to attempt reading package.json >> %O",
        error,
      );
      return false;
    }
  };
  const createPackage = (url) => {
    let content;
    try {
      content = fs.readFileSync(
        new URL$3(appendURLSegment(url, "package.json")),
        "utf8",
      );
    } catch (error) {
      logWarning("Cannot read package.json file at %j >> %O", url, error);
      return null;
    }
    let json;
    try {
      json = parseJSON$3(content);
    } catch (error) {
      logWarning("Failed to parse package.json file at %j >> %O", url, error);
      return null;
    }
    const { name, version, homepage } = {
      name: null,
      version: null,
      homepage: null,
      ...json,
    };
    if (typeof name !== "string") {
      logWarning("Invalid name property in package.json file at %j", url);
      return null;
    }
    if (typeof version !== "string") {
      logWarning("Invalid version property in package.json file at %j", url);
      return null;
    }
    return {
      name,
      version,
      homepage: typeof homepage === "string" ? homepage : null,
    };
  };
  return {
    extractRepositoryHistory: extractGitInformation,
    extractRepositoryPackage: createPackage,
    extractRepositoryDependency: (home, segments) => {
      const { resolve } = module$1.createRequire(
        new URL$3(appendURLSegment(home, "dummy.js")),
      );
      let url$1 = url.pathToFileURL(
        expectSuccess(
          () => resolve(segments.join("/")),
          "could not resolve %j from %j >> %O",
          segments,
          home,
        ),
      );
      url$1 = appendURLSegment(url$1, "..");
      while (!hasPackageJSON(url$1)) {
        const parent_url = appendURLSegment(url$1, "..");
        expect(
          parent_url !== url$1,
          "failed to find package.json file from module %j in repository %j",
          segments,
          home,
        );
        url$1 = parent_url;
      }
      return {
        directory: url$1,
        package: createPackage(url$1),
      };
    },
  };
};

const {
  Error: Error$3,
  URL: URL$2,
  RegExp,
  Object: { entries: toEntries },
  JSON: { stringify: stringifyJSON$3 },
} = globalThis;

var configuration_accessor$default = (dependencies) => {
  const {
    path: { getShell },
    util: { assert, coalesce },
    url: { pathifyURL, urlifyPath, appendURLSegmentArray },
    expect: { expect, expectSuccess },
    log: { logGuardWarning },
    repository: {
      extractRepositoryDependency,
      extractRepositoryHistory,
      extractRepositoryPackage,
    },
    specifier: { matchSpecifier },
    configuration: { extendConfiguration },
  } = dependencies;

  const getSpecifierValue = (pairs, key) => {
    for (const [specifier, value] of pairs) {
      if (matchSpecifier(specifier, key)) {
        return value;
      }
    }
    /* c8 ignore start */
    throw new Error$3("missing matching specifier");
    /* c8 ignore stop */
  };

  const escapeShell = (token) => token.replace(/[^a-zA-Z0-9\-_./:@]/gu, "\\$&");

  /* c8 ignore start */
  const escapeCmdExe = (token) =>
    token.replace(/[^a-zA-Z0-9\-_./:@\\]/gu, "^$&");
  const generateEscape = (shell) =>
    shell.endsWith("cmd") || shell.endsWith("cmd.exe")
      ? escapeCmdExe
      : escapeShell;
  /* c8 ignore stop */

  const generateCommand = (shell, tokens) =>
    tokens.map(generateEscape(shell)).join(" ");

  const mocha_regexps = [
    /^(?<before>mocha)(?<after>($|\s[\s\S]*$))/u,
    /^(?<before>npx\s+mocha)(?<after>($|\s[\s\S]*$))/u,
    /^(?<before>npm\s+exec\s+mocha)(?<after>($|\s[\s\S]*$))/u,
  ];
  const splitMocha = (command) => {
    for (const regexp of mocha_regexps) {
      const result = regexp.exec(command);
      if (result !== null) {
        return result.groups;
      }
    }
    return null;
  };

  return {
    resolveConfigurationRepository: (configuration) => {
      assert(configuration.agent === null, "duplicate respository resolution");
      const { directory } = configuration.repository;
      return extendConfiguration(
        configuration,
        {
          agent: extractRepositoryDependency(directory, [
            "@appland",
            "appmap-agent-js",
          ]),
          repository: {
            directory,
            history: extractRepositoryHistory(directory),
            package: extractRepositoryPackage(directory),
          },
        },
        directory,
      );
    },
    resolveConfigurationAutomatedRecorder: (configuration) => {
      if (configuration.recorder === null) {
        assert(
          configuration.command !== null,
          "cannot resolve recorder because command is missing",
        );
        configuration = extendConfiguration(
          configuration,
          {
            recorder:
              splitMocha(
                configuration.command.script === null
                  ? configuration.command.tokens.join(" ")
                  : configuration.command.script,
              ) === null
                ? "remote"
                : "mocha",
          },
          configuration.repository.directory,
        );
      }
      return configuration;
    },
    resolveConfigurationManualRecorder: (configuration) => {
      const {
        recorder,
        hooks: { esm },
      } = configuration;
      logGuardWarning(
        recorder !== "manual",
        "Manual recorder expected configuration field 'recorder' to be %s and got %j.",
        "manual",
        recorder,
      );
      logGuardWarning(
        esm,
        "Manual recorder does not support native module recording and configuration field 'hooks.esm' is enabled.",
      );
      return extendConfiguration(
        configuration,
        {
          recorder: "manual",
          hooks: {
            esm: false,
          },
        },
        configuration.repository.directory,
      );
    },
    extendConfigurationNode: (configuration, { version, argv, cwd }) => {
      assert(argv.length >= 2, "expected at least two argv");
      const [, main] = argv;
      assert(version.startsWith("v"), "expected version to start with v");
      return extendConfiguration(
        configuration,
        {
          engine: `node@${version.substring(1)}`,
          main,
        },
        urlifyPath(cwd(), configuration.repository.directory),
      );
    },
    extendConfigurationPort: (configuration, ports) => {
      for (const [key, new_port] of toEntries(ports)) {
        const { [key]: old_port } = configuration;
        if (old_port === 0 || old_port === "") {
          assert(typeof new_port === typeof old_port, "port type mismatch");
          configuration = extendConfiguration(
            configuration,
            { [key]: new_port },
            configuration.repository.directory,
          );
        } else {
          assert(old_port === new_port);
        }
      }
      return configuration;
    },
    isConfigurationEnabled: ({ processes, main }) =>
      main === null || getSpecifierValue(processes, main),
    getConfigurationPackage: ({ packages }, url) =>
      getSpecifierValue(packages, url),
    getConfigurationScenarios: (configuration) => {
      const { scenarios, scenario } = configuration;
      const regexp = expectSuccess(
        () => new RegExp(scenario, "u"),
        "Scenario configuration field is not a valid regexp: %j >> %O",
        scenario,
      );
      return scenarios
        .filter(({ key }) => regexp.test(key))
        .map(({ base, value }) =>
          extendConfiguration(configuration, { scenarios: {}, ...value }, base),
        );
    },
    compileConfigurationCommand: (configuration, env) => {
      assert(configuration.agent !== null, "missing agent in configuration");
      assert(
        configuration.command !== null,
        "missing command in configuration",
      );
      const {
        command: { base, script, tokens },
        recorder,
        "command-options": { shell, ...options },
        "recursive-process-recording": recursive,
        agent: { directory },
      } = configuration;
      env = {
        ...env,
        ...options.env,
        APPMAP_CONFIGURATION: stringifyJSON$3(configuration),
      };
      const [exec, ...flags] = shell === null ? getShell(env) : shell;
      let command = script === null ? generateCommand(exec, tokens) : script;
      logGuardWarning(
        recursive && recorder === "mocha",
        "The mocha recorder cannot recursively record processes.",
      );
      if (recursive || recorder === "mocha") {
        if (recorder === "mocha") {
          const groups = splitMocha(command);
          expect(
            groups !== null,
            "Could not parse the command %j as a mocha command",
            tokens,
          );
          command = `${groups.before} --require ${pathifyURL(
            appendURLSegmentArray(directory, [
              "lib",
              "node",
              "recorder-mocha.mjs",
            ]),
            base,
            true,
          )}${groups.after}`;
        }
        env = {
          ...env,
          NODE_OPTIONS: [
            coalesce(env, "NODE_OPTIONS", ""),
            // abomination: https://github.com/mochajs/mocha/issues/4720
            `--require=${pathifyURL(
              appendURLSegmentArray(directory, [
                "lib",
                "node",
                "abomination.js",
              ]),
              base,
              true,
            )}`,
            ...(configuration.hooks.esm
              ? [
                  `--experimental-loader=${generateEscape(exec)(
                    pathifyURL(
                      appendURLSegmentArray(directory, [
                        "lib",
                        "node",
                        "loader.cjs",
                      ]),
                      base,
                      true,
                    ),
                  )}`,
                ]
              : /* c8 ignore start */ []) /* c8 ignore stop */,
            `--experimental-loader=${generateEscape(exec)(
              pathifyURL(
                appendURLSegmentArray(directory, [
                  "lib",
                  "node",
                  recorder === "mocha"
                    ? "mocha-validate.mjs"
                    : `recorder-${recorder}.mjs`,
                ]),
                base,
                true,
              ),
            )}`,
          ].join(" "),
        };
      } else {
        const parts =
          /^(?<before>\s*\S*node(.[a-zA-Z]+)?)(?<after>($|\s[\s\S]*$))$/u.exec(
            command,
          );
        expect(
          parts !== null,
          "Could not find node exectuable in command %j",
          command,
        );
        command = `${parts.groups.before} ${
          configuration.hooks.esm
            ? `--experimental-loader ${generateEscape(exec)(
                pathifyURL(
                  appendURLSegmentArray(directory, [
                    "lib",
                    "node",
                    "loader.cjs",
                  ]),
                  base,
                  true,
                ),
              )}`
            : /* c8 ignore start */ "" /* c8 ignore stop */
        } --experimental-loader ${generateEscape(exec)(
          pathifyURL(
            appendURLSegmentArray(directory, [
              "lib",
              "node",
              `recorder-${recorder}.mjs`,
            ]),
            base,
            true,
          ),
        )}${parts.groups.after}`;
      }
      return {
        exec,
        argv: [...flags, command],
        options: {
          ...options,
          cwd: new URL$2(base),
          env,
        },
      };
    },
  };
};

const {
  Date: { now },
  Math: { random },
} = globalThis;

const getUUID = () =>
  `${now().toString(32).substr(-4)}${random().toString(32).substr(-4)}`;

var uuid$random = (_dependencies) => ({ getUUID });

const { Promise: Promise$3, Set: Set$1, setTimeout: setTimeout$1 } = globalThis;

var service$default = (dependencies) => {
  const {
    log: { logWarning },
    url: { appendURLSegment },
    path: { toIPCPath, fromIPCPath },
    uuid: { getUUID },
  } = dependencies;
  return {
    openServiceAsync: (server, port) => {
      const sockets = new Set$1();
      server.on("connection", (socket) => {
        sockets.add(socket);
        /* c8 ignore start */
        socket.on("error", (error) => {
          logWarning("Socket error >> %O", error);
        });
        /* c8 ignore stop */
        socket.on("close", () => {
          sockets.delete(socket);
        });
      });
      return new Promise$3((resolve, reject) => {
        server.on("error", reject);
        server.on("listening", () => {
          server.removeListener("error", reject);
          resolve({ server, sockets });
        });
        if (port === "") {
          port = appendURLSegment(
            url.pathToFileURL(OperatingSystem.tmpdir()),
            getUUID(),
          );
        }
        server.listen(
          typeof port === "string" ? toIPCPath(url.fileURLToPath(port)) : port,
        );
      });
    },
    getServicePort: ({ server }) => {
      const address = server.address();
      return typeof address === "string"
        ? url.pathToFileURL(fromIPCPath(address)).toString()
        : address.port;
    },
    closeServiceAsync: ({ server, sockets }) =>
      new Promise$3((resolve, reject) => {
        server.on("error", reject);
        server.on("close", resolve);
        server.close();
        for (const socket of sockets) {
          socket.end();
        }
        setTimeout$1(() => {
          /* c8 ignore start */
          for (const socket of sockets) {
            logWarning("Socket failed to gracefully shutdown");
            socket.destroy();
          }
          /* c8 ignore stop */
        }, 1000);
      }),
  };
};

const { request: createRequest } = Http__default["default"];

const {
  Buffer: { from: toBuffer, concat: concatBuffer },
  Promise: Promise$2,
  Error: Error$2,
  JSON: { parse: parseJSON$2, stringify: stringifyJSON$2 },
} = globalThis;

const INVALID_HEADERS_MESSAGE =
  "in the presence of a body, 'content-type' should be 'application/json; charset=UTF-8'";

var http$node_http = (dependencies) => {
  const {
    util: { noop, hasOwnProperty },
    path: { toIPCPath },
  } = dependencies;
  const parse = (body) => {
    if (body === "") {
      return null;
    }
    return parseJSON$2(body);
  };
  const stringify = (data) => {
    if (data === null) {
      return "";
    }
    return stringifyJSON$2(data);
  };
  const areValidHeaders = (headers) =>
    !hasOwnProperty(headers, "content-length") ||
    headers["content-length"] === "0" ||
    (hasOwnProperty(headers, "content-type") &&
      headers["content-type"] === "application/json; charset=UTF-8");
  const empty_headers = {
    "content-length": 0,
  };
  const createHeaders = ({ length }) => {
    if (length === 0) {
      return empty_headers;
    }
    return {
      "content-type": "application/json; charset=UTF-8",
      "content-length": length,
    };
  };
  return {
    requestAsync: (host, port, method, path, data) =>
      new Promise$2((resolve, reject) => {
        const buffer = toBuffer(stringify(data), "utf8");
        const request = createRequest({
          host,
          port: typeof port === "number" ? port : null,
          socketPath:
            typeof port === "string" ? toIPCPath(url.fileURLToPath(port)) : null,
          method,
          path,
          headers: createHeaders(buffer),
        });
        request.end(buffer);
        request.on("error", reject);
        request.on("response", (response) => {
          response.on("error", reject);
          if (areValidHeaders(response.headers)) {
            const buffers = [];
            response.on("data", (buffer) => {
              buffers.push(buffer);
            });
            response.on("end", () => {
              resolve({
                code: response.statusCode,
                message: response.statusMessage,
                body: parse(concatBuffer(buffers).toString("utf8")),
              });
            });
          } else {
            reject(new Error$2(INVALID_HEADERS_MESSAGE));
          }
        });
      }),
    generateRespond: (respondAsync) => (request, response) => {
      if (areValidHeaders(request.headers)) {
        const buffers = [];
        request.on("data", (buffer) => {
          buffers.push(buffer);
        });
        request.on("end", async () => {
          const { code, message, body } = await respondAsync(
            request.method,
            request.url,
            parse(concatBuffer(buffers).toString("utf8")),
          );
          const buffer = toBuffer(stringify(body), "utf8");
          response.writeHead(code, message, createHeaders(buffer));
          response.end(buffer);
        });
      } else {
        request.on("data", noop);
        request.on("end", noop);
        response.writeHead(400, INVALID_HEADERS_MESSAGE, empty_headers);
        response.end();
      }
    },
  };
};

const { patch: patchSocket$1 } = NetSocketMessaging__default["default"];

const {
  URL: URL$1,
  Error: Error$1,
  Map: Map$2,
  JSON: { parse: parseJSON$1 },
} = globalThis;

var receptor_http$default = (dependencies) => {
  const {
    util: { assert, coalesce },
    http: { generateRespond },
    log: { logDebug, logError },
    service: { openServiceAsync, closeServiceAsync, getServicePort },
    backend: {
      createBackend,
      sendBackend,
      hasBackendTrace,
      hasBackendTrack,
      getBackendTrackIterator,
      takeBackendTrace,
    },
    "configuration-accessor": { extendConfigurationPort },
  } = dependencies;
  return {
    minifyReceptorConfiguration: ({
      recorder,
      "trace-port": trace_port,
      "track-port": track_port,
    }) => ({
      recorder,
      "trace-port": trace_port,
      "track-port": track_port,
    }),
    openReceptorAsync: async ({
      recorder,
      "track-port": track_port,
      "trace-port": trace_port,
    }) => {
      assert(recorder === "remote", "invalid recorder for receptor-http");
      const trace_server = net.createServer();
      const track_server = Http.createServer();
      const backends = new Map$2();
      track_server.on(
        "request",
        generateRespond((method, path, body) => {
          logDebug("Received remote recording request: %s %s", method, path);
          const parts = path.split("/");
          if (parts.length !== 3 || parts[0] !== "") {
            return {
              code: 400,
              message: "Bad Request",
              body: null,
            };
          }
          let [, session, record] = parts;
          if (session === "_appmap") {
            const iterator = backends.keys();
            const { done, value } = iterator.next();
            if (done) {
              return {
                code: 404,
                message: "No Active Session",
                body: null,
              };
            }
            session = value;
          } else if (!backends.has(session)) {
            return {
              code: 404,
              message: "Missing Session",
              body: null,
            };
          }
          const backend = backends.get(session);
          if (method === "POST") {
            if (
              hasBackendTrack(backend, record) ||
              hasBackendTrace(backend, record)
            ) {
              return {
                code: 409,
                message: "Duplicate Track",
                body: null,
              };
            }
            sendBackend(backend, {
              type: "start",
              track: record,
              configuration: coalesce(body, "data", {}),
              url: coalesce(body, "path", null),
            });
            return {
              code: 200,
              message: "OK",
              body: null,
            };
          }
          if (method === "GET") {
            return {
              code: 200,
              message: "OK",
              body: {
                enabled: hasBackendTrack(backend, record),
              },
            };
          }
          if (method === "DELETE") {
            if (hasBackendTrack(backend, record)) {
              sendBackend(backend, {
                type: "stop",
                track: record,
                status: coalesce(body, "status", 0),
              });
            } else if (!hasBackendTrace(backend, record)) {
              return {
                code: 404,
                message: "Missing Track",
                body: null,
              };
            }
            const { body: trace } = takeBackendTrace(backend, record);
            return {
              code: 200,
              message: "OK",
              body: trace,
            };
          }
          /* c8 ignore start */
          throw new Error$1("invalid http method");
          /* c8 ignore stop */
        }),
      );
      trace_server.on("connection", (socket) => {
        patchSocket$1(socket);
        socket.on("message", (session) => {
          socket.removeAllListeners("message");
          socket.on("message", (content) => {
            socket.removeAllListeners("message");
            const configuration = parseJSON$1(content);
            const { recorder } = configuration;
            if (recorder !== "remote") {
              logError(
                "Http receptor expected remote recorder but got: ",
                recorder,
              );
              socket.destroy();
            } else {
              const backend = createBackend(configuration);
              backends.set(session, backend);
              socket.on("close", () => {
                sendBackend(backend, {
                  type: "error",
                  name: "AppmapError",
                  message: "disconnection",
                  stack: "",
                });
                for (const key of getBackendTrackIterator(backend)) {
                  sendBackend(backend, {
                    type: "stop",
                    track: key,
                    status: 1,
                  });
                }
              });
              socket.on("message", (content) => {
                const message = parseJSON$1(content);
                if (message.type === "source" && message.content === null) {
                  message.content = fs.readFileSync(new URL$1(message.url), "utf8");
                }
                sendBackend(backend, message);
              });
            }
          });
        });
      });
      const trace_service = await openServiceAsync(trace_server, trace_port);
      const track_service = await openServiceAsync(track_server, track_port);
      logDebug("Trace port: %j", getServicePort(trace_service));
      logDebug("Track port: %j", getServicePort(track_service));
      return { trace_service, track_service };
    },
    adaptReceptorConfiguration: (
      { trace_service, track_service },
      configuration,
    ) =>
      extendConfigurationPort(configuration, {
        "trace-port": getServicePort(trace_service),
        "track-port": getServicePort(track_service),
      }),
    closeReceptorAsync: async ({ trace_service, track_service }) => {
      await closeServiceAsync(trace_service);
      await closeServiceAsync(track_service);
    },
  };
};

const { patch: patchSocket } = NetSocketMessaging__default["default"];

const {
  JSON: { parse: parseJSON, stringify: stringifyJSON$1 },
  URL,
  String,
  Set,
} = globalThis;

var receptor_file$default = (dependencies) => {
  const {
    "configuration-accessor": { extendConfigurationPort },
    path: { makeSegment },
    url: { appendURLSegment },
    util: { assert },
    log: { logDebug, logInfo, logError },
    expect: { expect },
    service: { openServiceAsync, closeServiceAsync, getServicePort },
    backend: {
      createBackend,
      sendBackend,
      getBackendTrackIterator,
      getBackendTraceIterator,
      takeBackendTrace,
    },
  } = dependencies;
  const isDirectoryAsync = async (directory) => {
    try {
      return (await promises.lstat(new URL(directory))).isDirectory();
    } catch (error) {
      const { code } = error;
      expect(
        code === "ENOENT",
        "cannot read directory status %j >> %O",
        directory,
        error,
      );
      return null;
    }
  };
  const createDirectoryAsync = async (directory) => {
    const is_directory = await isDirectoryAsync(directory);
    if (is_directory === null) {
      const parent_directory = appendURLSegment(directory, "..");
      expect(
        parent_directory !== directory,
        "could not find any existing directory in the hiearchy of the storage directory",
      );
      await createDirectoryAsync(parent_directory);
      await promises.mkdir(new URL(directory));
    } else {
      expect(
        is_directory,
        "cannot create directory %j because it is a file",
        directory,
      );
    }
  };
  const store = (
    urls,
    directory,
    { head: { appmap_file: basename, "map-name": map_name }, body: trace },
  ) => {
    if (basename === null) {
      basename = map_name === null ? "anonymous" : map_name;
    }
    basename = basename.replace(/[\t\n ]/gu, "");
    let url = appendURLSegment(
      directory,
      makeSegment(`${basename}.appmap.json`, "-"),
    );
    let counter = 0;
    while (urls.has(url)) {
      counter += 1;
      url = appendURLSegment(
        directory,
        makeSegment(`${basename}-${String(counter)}.appmap.json`, "-"),
      );
    }
    urls.add(url);
    fs.writeFileSync(new URL(url), stringifyJSON$1(trace, null, 2), "utf8");
    logInfo("Trace written at: %s", url);
  };
  return {
    minifyReceptorConfiguration: ({
      recorder,
      "trace-port": trace_port,
      appmap_dir,
    }) => ({
      recorder,
      "trace-port": trace_port,
      appmap_dir,
    }),
    openReceptorAsync: async ({
      recorder,
      "trace-port": trace_port,
      appmap_dir: directory,
    }) => {
      assert(
        recorder === "mocha" || recorder === "process",
        "invalid recorder for receptor-file",
      );
      const recorder_directory = appendURLSegment(directory, recorder);
      await createDirectoryAsync(recorder_directory);
      const server = net.createServer();
      const urls = new Set();
      server.on("connection", (socket) => {
        patchSocket(socket);
        socket.on("message", (_session) => {
          socket.removeAllListeners("message");
          socket.on("message", (content) => {
            socket.removeAllListeners("message");
            const configuration = parseJSON(content);
            const { recorder } = configuration;
            if (recorder !== "process" && recorder !== "mocha") {
              logError(
                "File receptor expected process/mocha recorder but got: ",
                recorder,
              );
              socket.destroy();
            } else {
              const backend = createBackend(configuration);
              socket.on("close", () => {
                sendBackend(backend, {
                  type: "error",
                  name: "AppmapError",
                  message: "disconnection",
                  stack: "",
                });
                for (const key of getBackendTrackIterator(backend)) {
                  sendBackend(backend, {
                    type: "stop",
                    track: key,
                    status: 1,
                  });
                }
                for (const key of getBackendTraceIterator(backend)) {
                  store(
                    urls,
                    recorder_directory,
                    takeBackendTrace(backend, key),
                  );
                }
              });
              socket.on("message", (content) => {
                const message = parseJSON(content);
                if (message.type === "source" && message.content === null) {
                  message.content = fs.readFileSync(new URL(message.url), "utf8");
                }
                sendBackend(backend, message);
                if (message.type === "stop") {
                  for (const key of getBackendTraceIterator(backend)) {
                    store(
                      urls,
                      recorder_directory,
                      takeBackendTrace(backend, key),
                    );
                  }
                }
              });
            }
          });
        });
      });
      const trace_service = await openServiceAsync(server, trace_port);
      logDebug("Trace port: %j", getServicePort(trace_service));
      return trace_service;
    },
    adaptReceptorConfiguration: (service, configuration) =>
      extendConfigurationPort(configuration, {
        "trace-port": getServicePort(service),
        "track-port": configuration["track-port"],
      }),
    closeReceptorAsync: closeServiceAsync,
  };
};

const { Map: Map$1 } = globalThis;

var receptor$default = (dependencies) => {
  const {
    util: { assert },
  } = dependencies;
  const recorders = new Map$1([
    ["remote", "receptor-http"],
    ["process", "receptor-file"],
    ["mocha", "receptor-file"],
  ]);
  return {
    minifyReceptorConfiguration: (configuration) => {
      assert(
        configuration.recorder !== null,
        "undefined recorder in configuration",
      );
      return dependencies[
        recorders.get(configuration.recorder)
      ].minifyReceptorConfiguration(configuration);
    },
    openReceptorAsync: async (configuration) => ({
      recorder: configuration.recorder,
      receptor: await dependencies[
        recorders.get(configuration.recorder)
      ].openReceptorAsync(configuration),
    }),
    closeReceptorAsync: async ({ recorder, receptor }) => {
      await dependencies[recorders.get(recorder)].closeReceptorAsync(receptor);
    },
    adaptReceptorConfiguration: ({ recorder, receptor }, configuration) =>
      dependencies[recorders.get(recorder)].adaptReceptorConfiguration(
        receptor,
        configuration,
      ),
  };
};

const {
  Map,
  JSON: { stringify: stringifyJSON },
  setTimeout,
  clearTimeout,
  Promise: Promise$1,
} = globalThis;

var batch$default = (dependencies) => {
  const {
    util: { assert },
    expect: { expectSuccessAsync },
    log: { logDebug, logInfo, logWarning },
    spawn: { spawn },
    "configuration-accessor": {
      getConfigurationScenarios,
      resolveConfigurationRepository,
      compileConfigurationCommand,
      resolveConfigurationAutomatedRecorder,
    },
    receptor: {
      openReceptorAsync,
      closeReceptorAsync,
      adaptReceptorConfiguration,
      minifyReceptorConfiguration,
    },
  } = dependencies;
  const getCommandDescription = ({ exec, argv }) => ({ exec, argv });
  const isCommandNonNull = ({ command }) => command !== null;
  return {
    mainAsync: async (process, configuration) => {
      configuration = resolveConfigurationRepository(configuration);
      const { env } = process;
      let interrupted = false;
      let subprocess = null;
      process.on("SIGINT", () => {
        interrupted = true;
        if (subprocess !== null) {
          const timeout = setTimeout(() => {
            /* c8 ignore start */
            assert(
              subprocess !== null,
              "the timer should have been cleared if the process closed itself",
            );
            subprocess.kill("SIGKILL");
            /* c8 ignore stop */
          }, 1000);
          subprocess.on("close", () => {
            clearTimeout(timeout);
          });
          subprocess.kill("SIGINT");
        }
      });
      const receptors = new Map();
      const createReceptorAsync = async (configuration) => {
        const receptor_configuration =
          minifyReceptorConfiguration(configuration);
        const key = stringifyJSON(receptor_configuration);
        if (!receptors.has(key)) {
          receptors.set(key, await openReceptorAsync(receptor_configuration));
        }
        return receptors.get(key);
      };
      const runConfigurationAsync = async (configuration, env) => {
        configuration = resolveConfigurationAutomatedRecorder(configuration);
        const receptor = await createReceptorAsync(configuration);
        configuration = adaptReceptorConfiguration(receptor, configuration);
        const description = getCommandDescription(configuration.command);
        const command = compileConfigurationCommand(configuration, env);
        logDebug("spawn child command = %j", command);
        subprocess = spawn(command.exec, command.argv, command.options);
        const { signal, status } = await expectSuccessAsync(
          new Promise$1((resolve, reject) => {
            subprocess.on("error", reject);
            subprocess.on("close", (status, signal) => {
              resolve({ signal, status });
            });
          }),
          "Child error %j >> %O",
          description,
        );
        subprocess = null;
        if (signal !== null) {
          logInfo("> Killed with: %s", signal);
        } else {
          logInfo("> Exited with: %j", status);
        }
        return { description, signal, status };
      };
      const configurations = [
        configuration,
        ...getConfigurationScenarios(configuration),
      ].filter(isCommandNonNull);
      const { length } = configurations;
      try {
        if (length === 0) {
          logWarning("Could not find any command to spawn.");
        } else if (length === 1) {
          const [configuration] = configurations;
          await runConfigurationAsync(configuration, env);
        } else {
          logInfo("Spawning %j processes sequentially", length);
          const summary = [];
          for (let index = 0; index < length; index += 1) {
            if (!interrupted) {
              logInfo("%j/%j", index + 1, length);
              summary.push(
                await runConfigurationAsync(configurations[index], env),
              );
            }
          }
          logInfo("Summary:");
          for (const { description, signal, status } of summary) {
            /* c8 ignore start */
            logInfo("%j >> %j", description, signal === null ? status : signal);
            /* c8 ignore stop */
          }
        }
      } finally {
        for (const receptor of receptors.values()) {
          await closeReceptorAsync(receptor);
        }
      }
      return 0;
    },
  };
};

var batch = (blueprint) => {
  const dependencies = {__proto__:null};
  dependencies["util"] = util$default();
  dependencies["violation"] = violation$exit();
  dependencies["expect-inner"] = expect_inner$default(dependencies);
  dependencies["expect"] = expect$default(dependencies);
  dependencies["log-inner"] = log_inner$write_sync(dependencies);
  if (!("log" in blueprint)) { throw new Error("missing instance for component log"); }
  dependencies["log"] = (blueprint["log"] === "warning" ? log$warning(dependencies) : (blueprint["log"] === "off" ? log$off(dependencies) : (blueprint["log"] === "info" ? log$info(dependencies) : (blueprint["log"] === "error" ? log$error(dependencies) : (blueprint["log"] === "debug" ? log$debug(dependencies) : ((() => { throw new Error("invalid instance for component log"); }) ()))))));
  dependencies["validate"] = validate$ajv(dependencies);
  if (!("validate-message" in blueprint)) { throw new Error("missing instance for component validate-message"); }
  dependencies["validate-message"] = (blueprint["validate-message"] === "on" ? validate_message$on(dependencies) : (blueprint["validate-message"] === "off" ? validate_message$off(dependencies) : ((() => { throw new Error("invalid instance for component validate-message"); }) ())));
  dependencies["path"] = path$node(dependencies);
  dependencies["url"] = url$default(dependencies);
  if (!("validate-appmap" in blueprint)) { throw new Error("missing instance for component validate-appmap"); }
  dependencies["validate-appmap"] = (blueprint["validate-appmap"] === "on" ? validate_appmap$on(dependencies) : (blueprint["validate-appmap"] === "off" ? validate_appmap$off(dependencies) : ((() => { throw new Error("invalid instance for component validate-appmap"); }) ())));
  dependencies["location"] = location$default();
  dependencies["specifier"] = specifier$default(dependencies);
  dependencies["configuration"] = configuration$default(dependencies);
  dependencies["trace"] = trace$appmap(dependencies);
  dependencies["backend"] = backend$default(dependencies);
  dependencies["spawn"] = spawn$node();
  dependencies["repository"] = repository$node(dependencies);
  dependencies["configuration-accessor"] = configuration_accessor$default(dependencies);
  dependencies["uuid"] = uuid$random();
  dependencies["service"] = service$default(dependencies);
  dependencies["http"] = http$node_http(dependencies);
  dependencies["receptor-http"] = receptor_http$default(dependencies);
  dependencies["receptor-file"] = receptor_file$default(dependencies);
  dependencies["receptor"] = receptor$default(dependencies);
  dependencies["batch"] = batch$default(dependencies);
  return dependencies["batch"];
};

module.exports = batch;
