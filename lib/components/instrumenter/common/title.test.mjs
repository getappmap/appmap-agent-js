import * as Acorn from "acorn";

import { strict as Assert } from "assert";

import { Counter } from "../../../util/index.mjs";

import { makeTitle } from "./title.mjs";

const test = (code, path) => {
  let node = Acorn.parse(code, { ecmaVersion: 2020, sourceType: "module" });
  let list = null;
  for (const segment of path) {
    if (!Array.isArray(node)) {
      list = { head: node, tail: list };
    }
    node = node[segment];
  }
  return makeTitle(node, list, new Counter());
};

Assert.equal(test(";", []), null);

// Declaration //

Assert.deepEqual(test("function f () {}", ["body", "0"]), {
  name: "f",
  bound: null,
  index: 1,
});

Assert.deepEqual(test("class c {}", ["body", "0"]), {
  name: "c",
  bound: null,
  index: 1,
});

Assert.deepEqual(
  test("export default function () {}", ["body", "0", "declaration"]),
  {
    name: "default",
    bound: null,
    index: 1,
  },
);

Assert.deepEqual(
  test("export default class {}", ["body", "0", "declaration"]),
  {
    name: "default",
    bound: null,
    index: 1,
  },
);

// Named Function Expression //

Assert.deepEqual(
  test("f = function g () {}", ["body", "0", "expression", "right"]),
  {
    name: "g",
    bound: null,
    index: 1,
  },
);

// Object Property //

Assert.deepEqual(
  test("({ get x () {} });", [
    "body",
    "0",
    "expression",
    "properties",
    "0",
    "value",
  ]),
  {
    name: "get x",
    bound: false,
    index: 1,
  },
);

Assert.deepEqual(
  test('({ "x": {} })', [
    "body",
    "0",
    "expression",
    "properties",
    "0",
    "value",
  ]),
  {
    name: '"x"',
    bound: false,
    index: 1,
  },
);

Assert.deepEqual(
  test("({ [x]: {} })", [
    "body",
    "0",
    "expression",
    "properties",
    "0",
    "value",
  ]),
  {
    name: "[#computed]",
    bound: false,
    index: 1,
  },
);

// MethodDefinition //

Assert.deepEqual(
  test("class c { constructor () {} } ", [
    "body",
    "0",
    "body",
    "body",
    "0",
    "value",
  ]),
  {
    name: "constructor",
    bound: false,
    index: 1,
  },
);

Assert.deepEqual(
  test("class c { static m () {} } ", [
    "body",
    "0",
    "body",
    "body",
    "0",
    "value",
  ]),
  {
    name: "m",
    bound: true,
    index: 1,
  },
);

Assert.deepEqual(
  test("class c { get m () {} } ", ["body", "0", "body", "body", "0", "value"]),
  {
    name: "get m",
    bound: false,
    index: 1,
  },
);

// Assignment //

Assert.deepEqual(test("(o = {});", ["body", "0", "expression", "right"]), {
  name: "o",
  bound: null,
  index: 1,
});

Assert.deepEqual(test("(o += {});", ["body", "0", "expression", "right"]), {
  name: "object-1",
  bound: null,
  index: 1,
});

// Initialization //

Assert.deepEqual(
  test("var o = {};", ["body", "0", "declarations", "0", "init"]),
  {
    name: "o",
    bound: null,
    index: 1,
  },
);
