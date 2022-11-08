import {
  assertEqual,
  assertThrow,
  assertDeepEqual,
} from "../../../__fixture__.mjs";
import {
  isExclusionMatched,
  matchExclusionList,
} from "./exclusion.mjs?env=test";

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

assertThrow(() => {
  isExclusionMatched(
    {
      ...and_exclusion,
      "qualified-name": 123,
    },
    { type: "function" },
    null,
  );
});

assertThrow(() => {
  isExclusionMatched(
    {
      ...and_exclusion,
      combinator: "invalid-combinator",
    },
    { type: "function" },
    null,
  );
});

assertThrow(() => {
  isExclusionMatched(
    {
      ...and_exclusion,
      "qualified-name": "foo",
    },
    { type: "invalid-entity-type" },
    null,
  );
});

assertThrow(() => {
  isExclusionMatched(
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
  isExclusionMatched(
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
  isExclusionMatched(
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
  isExclusionMatched(
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
  isExclusionMatched(
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
  isExclusionMatched(
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
  isExclusionMatched(
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
  isExclusionMatched(
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
  isExclusionMatched(
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
  isExclusionMatched(
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
  isExclusionMatched(
    {
      ...and_exclusion,
      "some-label": "^foo",
    },
    { type: "function", static: false, name: "bar", labels: ["bar", "barfoo"] },
    { type: "class", name: "qux" },
  ),
  false,
);

// matchExclusionList //

assertThrow(() => {
  matchExclusionList([], { type: "function" }, null);
});

assertDeepEqual(
  matchExclusionList(
    [
      {
        combinator: "or",
        "every-label": true,
        "some-label": true,
        name: true,
        "qualified-name": true,
        excluded: true,
        recursive: false,
      },
    ],
    { type: "function", name: "foo" },
    null,
  ),
  {
    excluded: true,
    recursive: false,
  },
);
