import { strict as Assert } from "assert";
import { parse } from "acorn";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Naming from "./index.mjs";

Error.stackTraceLimit = Infinity;

const {
  equal: assertEqual,
  // deepEqual: assertDeepEqual
} = Assert;

const testAsync = async () => {
  const dependencies = await buildTestDependenciesAsync(import.meta.url);
  const { createCounter } = await buildTestComponentAsync("util");

  const { getQualifiedName, getLineage } = Naming(dependencies);

  const test = (code, path) =>
    getQualifiedName(
      createCounter(0),
      getLineage(parse(code, { ecmaVersion: 2020 }), path),
    );

  assertEqual(test("123;", "body/0/expression"), null);

  /////////////////
  // environment //
  /////////////////

  assertEqual(test(`({});`, "body/0/expression"), "object-1");

  assertEqual(test("var x = {};", "body/0/declarations/0/init"), "x");

  assertEqual(test("x = {};", "body/0/expression/right"), "x");

  assertEqual(test("(function f () {});", "body/0/expression"), "f");

  assertEqual(test("(class c {});", "body/0/expression"), "c");

  assertEqual(test("function f () {}", "body/0"), "f");

  assertEqual(test("class c {}", "body/0"), "c");

  //////////////
  // property //
  //////////////

  assertEqual(
    test("({k: {}});", "body/0/expression/properties/0/value"),
    "object-1.k",
  );

  assertEqual(
    test("({[k]: {}});", "body/0/expression/properties/0/value"),
    "object-1.<computed>",
  );

  assertEqual(
    test("({'k': {}});", "body/0/expression/properties/0/value"),
    'object-1."k"',
  );

  assertEqual(
    test("({123.456: {}});", "body/0/expression/properties/0/value"),
    'object-1."123.456"',
  );

  ////////////
  // method //
  ////////////

  assertEqual(test("class c { k () {} }", "body/0/body/body/0/value"), "c.k");

  assertEqual(
    test("class c { static k () {} }", "body/0/body/body/0/value"),
    "c#k",
  );
};

testAsync();
