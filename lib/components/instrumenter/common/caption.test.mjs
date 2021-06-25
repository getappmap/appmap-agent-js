import * as Acorn from "acorn";
import { strict as Assert } from "assert";
import { setParent } from "./parent.mjs";
import { computeCaption } from "./caption.mjs";

const index = 123;

const test = (code, path) => {
  let node = Acorn.parse(code, { ecmaVersion: 2020, sourceType: "module" });
  let parent = node;
  for (const segment of path) {
    node = node[segment];
    if (!Array.isArray(node)) {
      setParent(node, parent);
      parent = node;
    }
  }
  return computeCaption(node, index);
};

// Anonymous //

Assert.deepEqual(test(";", ["body", "0"]), {
  origin: "EmptyStatement",
  name: null,
  index,
});

// Property //

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
    origin: "Property",
    name: "get x",
    index,
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
    origin: "Property",
    name: '"x"',
    index,
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
    origin: "Property",
    name: "[#computed]",
    index,
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
    origin: "MethodDefinition",
    name: "constructor",
    index,
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
    origin: "MethodDefinition",
    name: "m",
    index,
  },
);

Assert.deepEqual(
  test("class c { get m () {} } ", ["body", "0", "body", "body", "0", "value"]),
  {
    origin: "MethodDefinition",
    name: "get m",
    index,
  },
);

// AssignmentExpression //

Assert.deepEqual(test("(o = {});", ["body", "0", "expression", "right"]), {
  origin: "AssignmentExpression",
  name: "o",
  index,
});

Assert.deepEqual(test("(o += {});", ["body", "0", "expression", "right"]), {
  origin: "ObjectExpression",
  name: null,
  index,
});

// VariableDeclarator //

Assert.deepEqual(
  test("var o = {};", ["body", "0", "declarations", "0", "init"]),
  {
    origin: "VariableDeclarator",
    name: "o",
    index,
  },
);
