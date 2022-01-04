import { assertEqual, assertThrow } from "../../__fixture__.mjs";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Specifier from "./index.mjs";

const { createSpecifier, matchSpecifier } = Specifier(
  await buildTestDependenciesAsync(import.meta.url),
);

assertThrow(
  () => createSpecifier("/foo", {}),
  /^AssertionError: invalid specifier options/,
);

////////////
// regexp //
////////////

assertEqual(
  matchSpecifier(createSpecifier("/foo", { regexp: "^bar" }), "/foo/bar.js"),
  true,
);

assertEqual(
  matchSpecifier(createSpecifier("/foo", { regexp: "^bar" }), "/qux/bar"),
  false,
);

//////////
// glob //
//////////

// normal //

assertEqual(
  matchSpecifier(createSpecifier("/foo", { glob: "*.js" }), "/foo/bar.js"),
  true,
);

assertEqual(
  matchSpecifier(createSpecifier("/foo", { glob: "*.js" }), "/foo/bar/qux.js"),
  false,
);

assertEqual(
  matchSpecifier(
    createSpecifier("/foo", { glob: "**/*.js" }),
    "/foo/bar/qux.js",
  ),
  true,
);

assertEqual(
  matchSpecifier(
    createSpecifier("/foo", { glob: "**/*.js" }),
    "/foo/../bar.js",
  ),
  false,
);

//////////
// Path //
//////////

// file //

assertEqual(
  matchSpecifier(createSpecifier("/foo", { path: "bar.js" }), "/foo/bar.js"),
  true,
);

// directory //

assertEqual(
  matchSpecifier(createSpecifier("/foo", { path: "bar" }), "/foo/bar/qux.js"),
  true,
);

// recursive //

assertEqual(
  matchSpecifier(
    createSpecifier("/foo", { path: "bar", recursive: false }),
    "/foo/bar/qux/buz.js",
  ),
  false,
);

assertEqual(
  matchSpecifier(
    createSpecifier("/foo", { path: "bar", recursive: true }),
    "/foo/bar/qux/buz.js",
  ),
  true,
);

//////////
// Dist //
//////////

// normal //

assertEqual(
  matchSpecifier(
    createSpecifier("/foo", { dist: "bar" }),
    "/foo/node_modules/bar/qux.js",
  ),
  true,
);

// recursive //

assertEqual(
  matchSpecifier(
    createSpecifier("/foo", { dist: "bar", recursive: false }),
    "/foo/node_modules/bar/qux/buz.js",
  ),
  false,
);

assertEqual(
  matchSpecifier(
    createSpecifier("/foo", { dist: "bar", recursive: true }),
    "/foo/node_modules/bar/qux/buz.js",
  ),
  true,
);

// external //

assertEqual(
  matchSpecifier(
    createSpecifier("/foo", { dist: "bar" }),
    "/node_modules/bar/qux.js",
  ),
  false,
);

assertEqual(
  matchSpecifier(
    createSpecifier("/foo", { dist: "bar", external: true }),
    "/node_modules/bar/qux.js",
  ),
  true,
);
