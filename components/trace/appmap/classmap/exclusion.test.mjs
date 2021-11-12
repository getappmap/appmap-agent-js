import { strict as Assert } from "assert";
import { buildTestDependenciesAsync } from "../../../build.mjs";
import Exclusion from "./exclusion.mjs";

const { equal: assertEqual, throws: assertThrows } = Assert;

const { createExclusion, isExcluded } = Exclusion(
  await buildTestDependenciesAsync(import.meta.url),
);

const exclusion = createExclusion(["foo#bar", "foo#bar", "^qux$", "^qux$"]);

for (const excluded of [true, false]) {
  assertEqual(
    isExcluded(
      exclusion,
      { type: "function", name: "bar", static: excluded },
      { type: "class", name: "foo" },
    ),
    excluded,
  );
}

assertEqual(
  isExcluded(
    exclusion,
    { type: "class", name: "qux" },
    { type: "class", name: "baz" },
  ),
  true,
);

assertEqual(
  isExcluded(exclusion, { type: "function", name: "qux" }, null),
  true,
);

assertEqual(
  isExcluded(
    exclusion,
    { type: "function", name: "qux" },
    { type: "function" },
  ),
  true,
);

assertThrows(() => isExcluded(exclusion, { type: "foo" }, null));

assertThrows(() =>
  isExcluded(exclusion, { type: "function" }, { type: "foo" }),
);
