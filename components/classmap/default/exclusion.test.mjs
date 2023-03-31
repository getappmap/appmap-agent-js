import {
  // assertEqual,
  assertThrow,
  assertDeepEqual,
} from "../../__fixture__.mjs";
import { parseEstree } from "../../parse/index.mjs";
import { digestEstreeRoot } from "./digest.mjs";
import { makeClassEntity } from "./entity.mjs";
import { compileExclusionArray } from "./exclusion.mjs";

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

const default_context = {
  url: "protocol://host/base/script.js",
  base: "protocol://host/base/",
  content: "",
  anonymous: "anonymous",
  inline: false,
  shallow: false,
};

assertThrow(
  () => compileExclusionArray([])(makeClassEntity("c", [], default_context)),
  "InternalAppmapError: missing matching exclusion",
);

assertDeepEqual(
  compileExclusionArray([
    {
      ...or_exclusion,
      name: true,
      excluded: true,
      recursive: true,
    },
    {
      ...and_exclusion,
      excluded: false,
      recursive: false,
    },
  ])(makeClassEntity("c", [], default_context), null),
  { excluded: true, recursive: true },
);

{
  const entities = digestEstreeRoot(
    parseEstree({
      url: "protocol://host/path.js",
      content: "var o = {k: /* @label l1 l2 */ () => {}};",
    }),
    default_context,
  );
  const exclude = compileExclusionArray([
    {
      ...and_exclusion,
      excluded: true,
      recursive: true,
      name: "^k$",
      "some-label": "^l1$",
      "every-label": "^l",
      "qualified-name": "^o.k$",
    },
    {
      ...and_exclusion,
      excluded: false,
      recursive: false,
    },
  ]);
  assertDeepEqual(exclude(entities[0], null), {
    excluded: false,
    recursive: false,
  });
  assertDeepEqual(exclude(entities[0].children[0], entities[0]), {
    excluded: true,
    recursive: true,
  });
}
