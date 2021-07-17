import { strict as Assert } from "assert";
import { buildAllAsync } from "../../../build.mjs";
import { dive } from "./__fixture__.mjs";
import Caption from "./caption.mjs";

const mainAsync = async () => {
  const { makeCaption, captionize } = Caption(await buildAllAsync(["util"]));

  const test = (code, keys) => captionize(dive(code, keys, "module"));

  Assert.deepEqual(makeCaption("foo", "bar"), {
    origin: "foo",
    name: "bar",
    bound: false,
  });

  // Anonymous //

  Assert.deepEqual(test(";", ["body", "0"]), {
    origin: "EmptyStatement",
    name: null,
    bound: false,
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
      bound: true,
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
      bound: true,
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
      bound: true,
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
      bound: true,
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
      bound: true,
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
      bound: true,
    },
  );

  // AssignmentExpression //

  Assert.deepEqual(test("(o = {});", ["body", "0", "expression", "right"]), {
    origin: "AssignmentExpression",
    name: "o",
    bound: false,
  });

  Assert.deepEqual(test("(o += {});", ["body", "0", "expression", "right"]), {
    origin: "ObjectExpression",
    name: null,
    bound: false,
  });

  // VariableDeclarator //

  Assert.deepEqual(
    test("var o = {};", ["body", "0", "declarations", "0", "init"]),
    {
      origin: "VariableDeclarator",
      name: "o",
      bound: false,
    },
  );
};

mainAsync();
