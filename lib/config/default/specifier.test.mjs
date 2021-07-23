import { strict as Assert } from "assert";
import { buildAsync } from "../../../build/index.mjs";
import Specifier from "./specifier.mjs";

const { equal: assertEqual, throws: assertThrows } = Assert;

const mainAsync = async () => {
  const { createSpecifier, matchSpecifier } = Specifier(
    await buildAsync({
      violation: "error",
      assert: "debug",
      util: "default",
    }),
  );

  assertThrows(
    () => createSpecifier("/foo", {}),
    /^AppmapError: invalid specifier options/,
  );

  /////////////
  // pattern //
  /////////////

  assertEqual(
    matchSpecifier(createSpecifier("/foo", { pattern: "^bar" }), "/foo/bar.js"),
    true,
  );

  assertEqual(
    matchSpecifier(createSpecifier("/foo", { pattern: "^bar" }), "/qux/bar"),
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
    matchSpecifier(
      createSpecifier("/foo", { glob: "*.js" }),
      "/foo/bar/qux.js",
    ),
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
      createSpecifier("/foo", { path: "bar" }),
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
      createSpecifier("/foo", { dist: "bar" }),
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
};

mainAsync();
