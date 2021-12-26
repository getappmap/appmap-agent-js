import {
  assertEqual,
  assertThrow,
  makeAbsolutePath,
} from "../../__fixture__.mjs";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Specifier from "./index.mjs";

const { createSpecifier, matchSpecifier } = Specifier(
  await buildTestDependenciesAsync(import.meta.url),
);

assertThrow(
  () => createSpecifier(makeAbsolutePath("foo"), {}),
  /^AssertionError: invalid specifier options/,
);

////////////
// regexp //
////////////

assertEqual(
  matchSpecifier(
    createSpecifier(makeAbsolutePath("foo"), { regexp: "^bar" }),
    makeAbsolutePath("foo", "bar.js"),
  ),
  true,
);

assertEqual(
  matchSpecifier(
    createSpecifier(makeAbsolutePath("foo"), { regexp: "^bar" }),
    makeAbsolutePath("qux", "bar"),
  ),
  false,
);

//////////
// glob //
//////////

// normal //

assertEqual(
  matchSpecifier(
    createSpecifier(makeAbsolutePath("foo"), { glob: "*.js" }),
    makeAbsolutePath("foo", "bar.js"),
  ),
  true,
);

assertEqual(
  matchSpecifier(
    createSpecifier(makeAbsolutePath("foo"), { glob: "*.js" }),
    makeAbsolutePath("foo", "bar", "qux.js"),
  ),
  false,
);

assertEqual(
  matchSpecifier(
    createSpecifier(makeAbsolutePath("foo"), { glob: "**/*.js" }),
    makeAbsolutePath("foo", "bar", "qux.js"),
  ),
  true,
);

assertEqual(
  matchSpecifier(
    createSpecifier(makeAbsolutePath("foo"), { glob: "**/*.js" }),
    makeAbsolutePath("foo", "..", "bar.js"),
  ),
  false,
);

//////////
// Path //
//////////

// file //

assertEqual(
  matchSpecifier(
    createSpecifier(makeAbsolutePath("foo"), { path: "bar.js" }),
    makeAbsolutePath("foo", "bar.js"),
  ),
  true,
);

// directory //

assertEqual(
  matchSpecifier(
    createSpecifier(makeAbsolutePath("foo"), { path: "bar" }),
    makeAbsolutePath("foo", "bar", "qux.js"),
  ),
  true,
);

// recursive //

assertEqual(
  matchSpecifier(
    createSpecifier(makeAbsolutePath("foo"), { path: "bar", recursive: false }),
    makeAbsolutePath("foo", "bar", "qux", "buz.js"),
  ),
  false,
);

assertEqual(
  matchSpecifier(
    createSpecifier(makeAbsolutePath("foo"), { path: "bar", recursive: true }),
    makeAbsolutePath("foo", "bar", "qux", "buz.js"),
  ),
  true,
);

//////////
// Dist //
//////////

// normal //

assertEqual(
  matchSpecifier(
    createSpecifier(makeAbsolutePath("foo"), { dist: "bar" }),
    makeAbsolutePath("foo", "node_modules", "bar", "qux.js"),
  ),
  true,
);

// recursive //

assertEqual(
  matchSpecifier(
    createSpecifier(makeAbsolutePath("foo"), { dist: "bar", recursive: false }),
    makeAbsolutePath("foo", "node_modules", "bar", "qux", "buz.js"),
  ),
  false,
);

assertEqual(
  matchSpecifier(
    createSpecifier(makeAbsolutePath("foo"), { dist: "bar", recursive: true }),
    makeAbsolutePath("foo", "node_modules", "bar", "qux", "buz.js"),
  ),
  true,
);

// external //

assertEqual(
  matchSpecifier(
    createSpecifier(makeAbsolutePath("foo"), { dist: "bar" }),
    makeAbsolutePath("node_modules", "bar", "qux.js"),
  ),
  false,
);

assertEqual(
  matchSpecifier(
    createSpecifier(makeAbsolutePath("foo"), { dist: "bar", external: true }),
    makeAbsolutePath("node_modules", "bar", "qux.js"),
  ),
  true,
);
