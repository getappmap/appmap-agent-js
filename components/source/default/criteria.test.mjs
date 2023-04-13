import { assertDeepEqual, assertThrow } from "../../__fixture__.mjs";
import { parseEstree } from "../../parse/index.mjs";
import { toEntity } from "./entity.mjs";
import { compileCriteria } from "./criteria.mjs";

const conj_crit = {
  combinator: "and",
  name: true,
  "qualified-name": true,
  "some-label": true,
  "every-label": true,
  excluded: true,
  recursive: false,
};

const disj_crit = {
  combinator: "or",
  name: false,
  "qualified-name": false,
  "some-label": false,
  "every-label": false,
  excluded: true,
  recursive: false,
};

const bottom = {
  ...conj_crit,
  excluded: false,
};

const FILE = "file";

const test = (code, criteria, path, excluded) => {
  const node = parseEstree({
    url: `protocol://host/directory/${FILE}.ext`,
    content: code,
  });
  let parent = null;
  let entity = toEntity(node, FILE);
  for (const segment of path.split("/")) {
    parent = entity;
    entity = entity.children[segment];
  }
  assertDeepEqual(compileCriteria(criteria)(entity, parent), {
    excluded,
    recursive: false,
  });
};

// miss //

assertThrow(
  () => test(`function f () {}`, [], "0", true),
  /InternalAppmapError: missing matching exclusion criterion/u,
);

// name //

test(
  `function f () {}`,
  [
    {
      ...conj_crit,
      name: "^f$",
    },
    bottom,
  ],
  "0",
  true,
);

test(
  `function f () {}`,
  [
    {
      ...conj_crit,
      name: "^g$",
    },
    bottom,
  ],
  "0",
  false,
);

// qualified-name //

test(
  `const o = { m () {} };`,
  [
    {
      ...conj_crit,
      "qualified-name": "^o\\.m$",
    },
    bottom,
  ],
  "0/0",
  true,
);

test(
  `const o = { m () {} };`,
  [
    {
      ...conj_crit,
      "qualified-name": "^p\\.q$",
    },
    bottom,
  ],
  "0/0",
  false,
);

test(
  `class c { static m () {} }`,
  [
    {
      ...conj_crit,
      "qualified-name": "^c#m$",
    },
    bottom,
  ],
  "0/0",
  true,
);

test(
  `const o = { k: {} };`,
  [
    {
      ...conj_crit,
      "qualified-name": "^k$",
    },
    bottom,
  ],
  "0/0",
  true,
);

// every-label //

test(
  `/* @label foo bar */ function f () {}`,
  [
    {
      ...conj_crit,
      "every-label": "^(foo|bar)$",
    },
    bottom,
  ],
  "0",
  true,
);

test(
  `/* @label foo bar qux */ function f () {}`,
  [
    {
      ...conj_crit,
      "every-label": "^(foo|bar)$",
    },
    bottom,
  ],
  "0",
  false,
);

// some-label //

test(
  `/* @label foo bar */ function f () {}`,
  [
    {
      ...conj_crit,
      "some-label": "^foo$",
    },
    bottom,
  ],
  "0",
  true,
);

test(
  `/* @label foo bar */ function f () {}`,
  [
    {
      ...conj_crit,
      "some-label": "^qux$",
    },
    bottom,
  ],
  "0",
  false,
);

// conjunction //

test(
  `/* @label foo bar */ function f () {}`,
  [
    {
      ...conj_crit,
      name: "^f$",
      "some-label": "^foo$",
    },
    bottom,
  ],
  "0",
  true,
);

test(
  `/* @label foo bar */ function f () {}`,
  [
    {
      ...conj_crit,
      name: "^g$",
      "some-label": "^foo$",
    },
    bottom,
  ],
  "0",
  false,
);

test(
  `/* @label foo bar */ function f () {}`,
  [
    {
      ...conj_crit,
      name: "^f$",
      "some-label": "^qux",
    },
    bottom,
  ],
  "0",
  false,
);

// disjunction //

test(
  `/* @label foo bar */ function f () {}`,
  [
    {
      ...disj_crit,
      name: "^g$",
      "some-label": "^foo$",
    },
    bottom,
  ],
  "0",
  true,
);

test(
  `/* @label foo bar */ function f () {}`,
  [
    {
      ...disj_crit,
      name: "^f$",
      "some-label": "^qux",
    },
    bottom,
  ],
  "0",
  true,
);

test(
  `/* @label foo bar */ function f () {}`,
  [
    {
      ...disj_crit,
      name: "^g$",
      "some-label": "^qux",
    },
    bottom,
  ],
  "0",
  false,
);
