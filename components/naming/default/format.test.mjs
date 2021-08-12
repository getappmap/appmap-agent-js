import { strict as Assert } from "assert";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Format from "./format.mjs";

const { equal: assertEqual, deepEqual: assertDeepEqual } = Assert;

const { parseQualifiedName, stringifyQualifiedName, isQualifiedName } = Format(
  await buildTestDependenciesAsync(import.meta.url),
);

assertEqual(isQualifiedName("foo#bar"), true);

assertEqual(isQualifiedName("foo.bar"), true);

assertEqual(isQualifiedName("foo"), true);

assertEqual(isQualifiedName("foo|bar"), false);

assertDeepEqual(
  stringifyQualifiedName(parseQualifiedName("foo#bar")),
  "foo#bar",
);

assertDeepEqual(
  stringifyQualifiedName(parseQualifiedName("foo.bar")),
  "foo.bar",
);

assertDeepEqual(stringifyQualifiedName(parseQualifiedName("foo")), "foo");
