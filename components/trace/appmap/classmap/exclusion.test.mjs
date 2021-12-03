import { strict as Assert } from "assert";
import { buildTestDependenciesAsync } from "../../../build.mjs";
import Exclusion from "./exclusion.mjs";

const { equal: assertEqual, throws: assertThrows } = Assert;

const { compileExclusion, isExclusionMatched } = Exclusion(
  await buildTestDependenciesAsync(import.meta.url),
);

const testExclusion = (exclusion, entity, parent) =>
  isExclusionMatched(compileExclusion(exclusion), entity, parent);

const or_exclusion = {
  combinator: "or",
  "every-label": false,
  "some-label": false,
  name: false,
  "qualified-name": false,
  excluded: true,
  recursive: true,
};

const and_exclusion = {
  combinator: "and",
  "every-label": true,
  "some-label": true,
  name: true,
  "qualified-name": true,
  excluded: true,
  recursive: true,
};

// Invalid //

assertThrows(() => {
  testExclusion(
    {
      ...and_exclusion,
      "qualified-name": 123,
    },
    { type: "function" },
    null,
  );
});

assertThrows(() => {
  testExclusion(
    {
      ...and_exclusion,
      combinator: "invalid-combinator",
    },
    { type: "function" },
    null,
  );
});

assertThrows(() => {
  testExclusion(
    {
      ...and_exclusion,
      "qualified-name": "foo",
    },
    { type: "invalid-entity-type" },
    null,
  );
});

assertThrows(() => {
  testExclusion(
    {
      ...and_exclusion,
      "qualified-name": "foo",
    },
    { type: "function" },
    { type: "invalid-entity-type" },
  );
});

// Class (Qualified) Name //

assertEqual(
  testExclusion(
    {
      ...and_exclusion,
      "qualified-name": "foo",
      name: "foo",
    },
    { type: "class", name: "foo" },
    null,
  ),
  true,
);

assertEqual(
  testExclusion(
    {
      ...and_exclusion,
      "qualified-name": "foo",
      name: "foo",
    },
    { type: "class", name: "foo" },
    null,
  ),
  true,
);

assertEqual(
  testExclusion(
    {
      ...or_exclusion,
      "qualified-name": "foo",
      name: "foo",
    },
    { type: "class", name: "bar" },
    null,
  ),
  false,
);

// Function (Qualified) Name //

assertEqual(
  testExclusion(
    {
      ...and_exclusion,
      "qualified-name": "foo",
      name: "foo",
    },
    { type: "function", static: true, name: "foo" },
    null,
  ),
  true,
);

assertEqual(
  testExclusion(
    {
      ...and_exclusion,
      "qualified-name": "foo#bar",
      name: "bar",
    },
    { type: "function", static: true, name: "bar" },
    { type: "class", name: "foo" },
  ),
  true,
);

assertEqual(
  testExclusion(
    {
      ...and_exclusion,
      "qualified-name": "foo\\.bar",
      name: "bar",
    },
    { type: "function", static: false, name: "bar" },
    { type: "class", name: "foo" },
  ),
  true,
);

// Function Every Labels //

assertEqual(
  testExclusion(
    {
      ...and_exclusion,
      "every-label": "^foo",
    },
    { type: "function", static: false, name: "bar", labels: ["foo", "foobar"] },
    { type: "class", name: "qux" },
  ),
  true,
);

assertEqual(
  testExclusion(
    {
      ...and_exclusion,
      "every-label": "^foo",
    },
    { type: "function", static: false, name: "bar", labels: ["foo", "barfoo"] },
    { type: "class", name: "qux" },
  ),
  false,
);

// Function Some Labels //

assertEqual(
  testExclusion(
    {
      ...and_exclusion,
      "some-label": "^foo",
    },
    { type: "function", static: false, name: "bar", labels: ["foo", "barfoo"] },
    { type: "class", name: "qux" },
  ),
  true,
);

assertEqual(
  testExclusion(
    {
      ...and_exclusion,
      "some-label": "^foo",
    },
    { type: "function", static: false, name: "bar", labels: ["bar", "barfoo"] },
    { type: "class", name: "qux" },
  ),
  false,
);
