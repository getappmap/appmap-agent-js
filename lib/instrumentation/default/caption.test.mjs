import { strict as Assert } from "assert";
import { buildAsync } from "../../../build/index.mjs";
import { dive, parse } from "./__fixture__.mjs";
import Caption from "./caption.mjs";

const mainAsync = async () => {
  const { makeCaption } = Caption(
    await buildAsync({ violation: "error", assert: "debug", util: "default" }),
  );

  const test = (code, keys) => makeCaption(dive(parse(code), keys, "module"));

  // Anonymous //

  Assert.deepEqual(test(";", ["body", "0"]), { origin: null, name: null });

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
    test("class c { get m () {} } ", [
      "body",
      "0",
      "body",
      "body",
      "0",
      "value",
    ]),
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
    origin: null,
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
};

mainAsync();
