const { encodeURIComponent } = globalThis;

import { assertEqual, assertThrow } from "../../__fixture__.mjs";
import { createSpecifier, matchSpecifier } from "./index.mjs?env=test";

assertThrow(
  () => createSpecifier({}, "protocol://host/base/"),
  /^Error: invalid specifier options/u,
);

////////////
// regexp //
////////////

assertEqual(
  matchSpecifier(
    createSpecifier({ regexp: "^file\\." }, "protocol://host/base/"),
    "protocol://host/base/file.ext",
  ),
  true,
);

assertEqual(
  matchSpecifier(
    createSpecifier({ regexp: "^file1\\." }, "protocol://host/base/"),
    "protocol://host/base/file2.ext",
  ),
  false,
);

assertEqual(
  matchSpecifier(
    createSpecifier({ regexp: "^file\\." }, "protocol://host/base1/"),
    "protocol://host/base2/file.ext",
  ),
  false,
);

assertEqual(
  matchSpecifier(
    createSpecifier(
      { regexp: "^\\.\\./base2/file2\\." },
      "protocol://host/base1/",
    ),
    "protocol://host/base2/file2.ext",
  ),
  true,
);

assertThrow(
  () =>
    matchSpecifier(
      createSpecifier({ regexp: "^" }, "protocol://host1/base/"),
      "protocol://host2/base/file.ext",
    ),
  /^AppmapError: could not express/u,
);

//////////
// glob //
//////////

// normal //

assertEqual(
  matchSpecifier(
    createSpecifier({ glob: "*.ext" }, "protocol://host/base/"),
    "protocol://host/base/file.ext",
  ),
  true,
);

assertEqual(
  matchSpecifier(
    createSpecifier({ glob: "*.ext" }, "protocol://host/base/"),
    "protocol://host/base/dir/file.ext",
  ),
  false,
);

assertEqual(
  matchSpecifier(
    createSpecifier({ glob: "**/*.ext" }, "protocol://host/base/"),
    "protocol://host/base/dir/file.ext",
  ),
  true,
);

assertEqual(
  matchSpecifier(
    createSpecifier({ glob: "**/*.js" }, "protocol://host/base/"),
    "protocol://host/base/../file.ext",
  ),
  false,
);

//////////
// Path //
//////////

// file //

assertEqual(
  matchSpecifier(
    createSpecifier({ path: "path" }, "protocol://host/base/"),
    "protocol://host/base/path",
  ),
  true,
);

assertEqual(
  matchSpecifier(
    createSpecifier(
      { path: `][ ${encodeURIComponent("#?")}` },
      "protocol://host/base/",
    ),
    `protocol://host/base/${encodeURIComponent("][ #?")}`,
  ),
  true,
);

// directory //

assertEqual(
  matchSpecifier(
    createSpecifier({ path: "path" }, "protocol://host/base/"),
    "protocol://host/base/path/file.ext",
  ),
  true,
);

// recursive //

assertEqual(
  matchSpecifier(
    createSpecifier(
      { path: "path", recursive: false },
      "protocol://host/base/",
    ),
    "protocol://host/base/path/dir/file.ext",
  ),
  false,
);

assertEqual(
  matchSpecifier(
    createSpecifier({ path: "path", recursive: true }, "protocol://host/base/"),
    "protocol://host/base/path/dir/file.ext",
  ),
  true,
);

//////////
// Dist //
//////////

// normal //

assertEqual(
  matchSpecifier(
    createSpecifier({ dist: "dist" }, "protocol://host/base/"),
    "protocol://host/base/node_modules/dist/file.ext",
  ),
  true,
);

// recursive //

assertEqual(
  matchSpecifier(
    createSpecifier(
      { dist: "dist", recursive: false },
      "protocol://host/base/",
    ),
    "protocol://host/base/node_modules/dist/dir/file.ext",
  ),
  false,
);

assertEqual(
  matchSpecifier(
    createSpecifier({ dist: "dist", recursive: true }, "protocol://host/base/"),
    "protocol://host/base/node_modules/dist/dir/file.ext",
  ),
  true,
);

// external //

assertEqual(
  matchSpecifier(
    createSpecifier({ dist: "dist" }, "protocol://host/base/"),
    "protocol://host/node_modules/dist/file.ext",
  ),
  false,
);

assertEqual(
  matchSpecifier(
    createSpecifier({ dist: "dist", external: true }, "protocol://host/base/"),
    "protocol://host/node_modules/dist/file.ext",
  ),
  true,
);

// constant //

assertEqual(matchSpecifier(true, "protocol://host/file.ext"), true);

assertEqual(matchSpecifier(false, "protocol://host/file.ext"), false);
