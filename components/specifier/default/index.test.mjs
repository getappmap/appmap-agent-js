import { assertEqual, assertThrow } from "../../__fixture__.mjs";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Specifier from "./index.mjs";

const { createSpecifier, matchSpecifier } = Specifier(
  await buildTestDependenciesAsync(import.meta.url),
);

assertThrow(
  () => createSpecifier({}, "file:///base"),
  /^AssertionError: invalid specifier options/,
);

////////////
// regexp //
////////////

assertEqual(
  matchSpecifier(
    createSpecifier({ regexp: "^file\\." }, "file:///base"),
    "file:///base/file.ext",
  ),
  true,
);

assertEqual(
  matchSpecifier(
    createSpecifier({ regexp: "^file\\." }, "file:///base"),
    "file:///base/FILE.ext",
  ),
  false,
);

assertEqual(
  matchSpecifier(
    createSpecifier({ regexp: "^file\\." }, "file:///base"),
    "file:///BASE/file.ext",
  ),
  false,
);

assertEqual(
  matchSpecifier(
    createSpecifier({ regexp: "^\\.\\./BASE/file\\." }, "file:///base"),
    "file:///BASE/file.ext",
  ),
  true,
);

assertEqual(
  matchSpecifier(
    createSpecifier({ regexp: "^" }, "file://host1/base"),
    "file://host2/base/file.ext",
  ),
  false,
);

//////////
// glob //
//////////

// normal //

assertEqual(
  matchSpecifier(
    createSpecifier({ glob: "*.ext" }, "file:///base"),
    "file:///base/file.ext",
  ),
  true,
);

assertEqual(
  matchSpecifier(
    createSpecifier({ glob: "*.ext" }, "file:///base"),
    "file:///base/dir/file.ext",
  ),
  false,
);

assertEqual(
  matchSpecifier(
    createSpecifier({ glob: "**/*.ext" }, "file:///base"),
    "file:///base/dir/file.ext",
  ),
  true,
);

assertEqual(
  matchSpecifier(
    createSpecifier({ glob: "**/*.js" }, "file:///base"),
    "file:///base/../file.ext",
  ),
  false,
);

//////////
// Path //
//////////

// file //

assertEqual(
  matchSpecifier(
    createSpecifier({ path: "path" }, "file:///base"),
    "file:///base/path",
  ),
  true,
);

assertEqual(
  matchSpecifier(
    createSpecifier({ path: "*" }, "file:///base"),
    "file:///base/*",
  ),
  true,
);

// directory //

assertEqual(
  matchSpecifier(
    createSpecifier({ path: "path" }, "file:///base"),
    "file:///base/path/file.ext",
  ),
  true,
);

// recursive //

assertEqual(
  matchSpecifier(
    createSpecifier({ path: "path", recursive: false }, "file:///base"),
    "file:///base/path/dir/file.ext",
  ),
  false,
);

assertEqual(
  matchSpecifier(
    createSpecifier({ path: "path", recursive: true }, "file:///base"),
    "file:///base/path/dir/file.ext",
  ),
  true,
);

//////////
// Dist //
//////////

// normal //

assertEqual(
  matchSpecifier(
    createSpecifier({ dist: "dist" }, "file:///base"),
    "file:///base/node_modules/dist/file.ext",
  ),
  true,
);

// recursive //

assertEqual(
  matchSpecifier(
    createSpecifier({ dist: "dist", recursive: false }, "file:///base"),
    "file:///base/node_modules/dist/dir/file.ext",
  ),
  false,
);

assertEqual(
  matchSpecifier(
    createSpecifier({ dist: "dist", recursive: true }, "file:///base"),
    "file:///base/node_modules/dist/dir/file.ext",
  ),
  true,
);

// external //

assertEqual(
  matchSpecifier(
    createSpecifier({ dist: "dist" }, "file:///base"),
    "file:///node_modules/dist/file.ext",
  ),
  false,
);

assertEqual(
  matchSpecifier(
    createSpecifier({ dist: "dist", external: true }, "file:///base"),
    "file:///node_modules/dist/file.ext",
  ),
  true,
);
