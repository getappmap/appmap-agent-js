import {
  // assertEqual,
  assertThrow,
  assertDeepEqual,
} from "../../../__fixture__.mjs";
import { parseEstree } from "./parse.mjs?env=test";
import { digestEstreeRoot } from "./digest.mjs?env=test";
import {
  makeClassEntity,
  excludeEntity,
  getEntitySummary,
} from "./entity.mjs?env=test";
import { compileExclusionArray } from "./exclusion.mjs?env=test";

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
  relative: "script.js",
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

assertDeepEqual(
  digestEstreeRoot(
    parseEstree(
      "protocol://host/path.js",
      "var o = {k: /* @label l1 l2 */ () => {}};",
    ),
    default_context,
  )
    .flatMap((entity) =>
      excludeEntity(
        entity,
        null,
        compileExclusionArray([
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
        ]),
      ),
    )
    .map(getEntitySummary),
  [{ type: "class", name: "o", children: [] }],
);
