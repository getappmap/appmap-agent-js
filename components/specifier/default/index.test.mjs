import { platform as getPlatform } from "os";
import { assertEqual, assertThrow } from "../../__fixture__.mjs";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Specifier from "./index.mjs";

const { createSpecifier, matchSpecifier } = Specifier(
  await buildTestDependenciesAsync(import.meta.url),
);

const makeRoot = (filename) =>
  `${getPlatform() === "win32" ? "C:\\" : "/"}${filename}`;
// path.join performs path normalization, which we don't want.
const joinPath = (...args) => args.join(getPlatform() === "win32" ? "\\" : "/");

assertThrow(
  () => createSpecifier(makeRoot("foo"), {}),
  /^AssertionError: invalid specifier options/,
);

////////////
// regexp //
////////////

assertEqual(
  matchSpecifier(
    createSpecifier(makeRoot("foo"), { regexp: "^bar" }),
    joinPath(makeRoot("foo"), "bar.js"),
  ),
  true,
);

assertEqual(
  matchSpecifier(
    createSpecifier(makeRoot("foo"), { regexp: "^bar" }),
    joinPath(makeRoot("qux"), "bar"),
  ),
  false,
);

//////////
// glob //
//////////

// normal //

assertEqual(
  matchSpecifier(
    createSpecifier(makeRoot("foo"), { glob: "*.js" }),
    joinPath(makeRoot("foo"), "bar.js"),
  ),
  true,
);

assertEqual(
  matchSpecifier(
    createSpecifier(makeRoot("foo"), { glob: "*.js" }),
    joinPath(makeRoot("foo"), "bar", "qux.js"),
  ),
  false,
);

assertEqual(
  matchSpecifier(
    createSpecifier(makeRoot("foo"), { glob: "**/*.js" }),
    joinPath(makeRoot("foo"), "bar", "qux.js"),
  ),
  true,
);

assertEqual(
  matchSpecifier(
    createSpecifier(makeRoot("foo"), { glob: "**/*.js" }),
    joinPath(makeRoot("foo"), "..", "bar.js"),
  ),
  false,
);

//////////
// Path //
//////////

// file //

assertEqual(
  matchSpecifier(
    createSpecifier(makeRoot("foo"), { path: "bar.js" }),
    joinPath(makeRoot("foo"), "bar.js"),
  ),
  true,
);

// directory //

assertEqual(
  matchSpecifier(
    createSpecifier(makeRoot("foo"), { path: "bar" }),
    joinPath(makeRoot("foo"), "bar", "qux.js"),
  ),
  true,
);

// recursive //

assertEqual(
  matchSpecifier(
    createSpecifier(makeRoot("foo"), { path: "bar", recursive: false }),
    joinPath(makeRoot("foo"), "bar", "qux", "buz.js"),
  ),
  false,
);

assertEqual(
  matchSpecifier(
    createSpecifier(makeRoot("foo"), { path: "bar", recursive: true }),
    joinPath(makeRoot("foo"), "bar", "qux", "buz.js"),
  ),
  true,
);

//////////
// Dist //
//////////

// normal //

assertEqual(
  matchSpecifier(
    createSpecifier(makeRoot("foo"), { dist: "bar" }),
    joinPath(makeRoot("foo"), "node_modules", "bar", "qux.js"),
  ),
  true,
);

// recursive //

assertEqual(
  matchSpecifier(
    createSpecifier(makeRoot("foo"), { dist: "bar", recursive: false }),
    joinPath(makeRoot("foo"), "node_modules", "bar", "qux", "buz.js"),
  ),
  false,
);

assertEqual(
  matchSpecifier(
    createSpecifier(makeRoot("foo"), { dist: "bar", recursive: true }),
    joinPath(makeRoot("foo"), "node_modules", "bar", "qux", "buz.js"),
  ),
  true,
);

// external //

assertEqual(
  matchSpecifier(
    createSpecifier(makeRoot("foo"), { dist: "bar" }),
    joinPath(makeRoot("node_modules"), "bar", "qux.js"),
  ),
  false,
);

assertEqual(
  matchSpecifier(
    createSpecifier(makeRoot("foo"), { dist: "bar", external: true }),
    joinPath(makeRoot("node_modules"), "bar", "qux.js"),
  ),
  true,
);
