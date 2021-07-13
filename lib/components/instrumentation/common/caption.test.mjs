import * as Acorn from "acorn";
import { strict as Assert } from "assert";
import { setNodeParent } from "./node.mjs";
import { captionize } from "./caption.mjs";

const test = (code, path) => {
  let node = Acorn.parse(code, { ecmaVersion: 2020, sourceType: "module" });
  let parent = node;
  for (const segment of path) {
    node = node[segment];
    if (!Array.isArray(node)) {
      setNodeParent(node, parent);
      parent = node;
    }
  }
  return captionize(node);
};

// Anonymous //

Assert.deepEqual(test(";", ["body", "0"]), {
  origin: "EmptyStatement",
  name: null,
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
  },
);

Assert.deepEqual(
  test("class c { get m () {} } ", ["body", "0", "body", "body", "0", "value"]),
  {
    origin: "MethodDefinition",
    name: "get m",
  },
);

// AssignmentExpression //

Assert.deepEqual(test("(o = {});", ["body", "0", "expression", "right"]), {
  origin: "AssignmentExpression",
  name: "o",
});

Assert.deepEqual(test("(o += {});", ["body", "0", "expression", "right"]), {
  origin: "ObjectExpression",
  name: null,
});

// VariableDeclarator //

Assert.deepEqual(
  test("var o = {};", ["body", "0", "declarations", "0", "init"]),
  {
    origin: "VariableDeclarator",
    name: "o",
  },
);
