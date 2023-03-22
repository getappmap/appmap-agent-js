import { assertEqual, assertThrow } from "../../__fixture__.mjs";
import { createMatcher, matchUrl, lookupUrl } from "./index.mjs";

const { encodeURIComponent } = globalThis;

assertThrow(
  () => createMatcher({}, "protocol://host/base/"),
  /^InternalAppmapError: invalid matcher options/u,
);

////////////
// regexp //
////////////

assertEqual(
  matchUrl(
    createMatcher({ regexp: "^file\\." }, "protocol://host/base/"),
    "protocol://host/base/file.ext",
  ),
  true,
);

assertEqual(
  matchUrl(
    createMatcher({ regexp: "^file1\\." }, "protocol://host/base/"),
    "protocol://host/base/file2.ext",
  ),
  false,
);

assertEqual(
  matchUrl(
    createMatcher({ regexp: "^file\\." }, "protocol://host/base1/"),
    "protocol://host/base2/file.ext",
  ),
  false,
);

assertEqual(
  matchUrl(
    createMatcher(
      { regexp: "^\\.\\./base2/file2\\." },
      "protocol://host/base1/",
    ),
    "protocol://host/base2/file2.ext",
  ),
  true,
);

assertThrow(
  () =>
    matchUrl(
      createMatcher({ regexp: ")(" }, "protocol://host/base/"),
      "protocol://host/base/file.ext",
    ),
  /^ExternalAppmapError: Failed to compile matcher regexp$/u,
);

assertEqual(
  matchUrl(
    createMatcher({ regexp: "^" }, "protocol://host1/base/"),
    "protocol://host2/base/file.ext",
  ),
  false,
);

assertEqual(
  matchUrl(
    createMatcher(
      { regexp: "/file\\.ext$", relative: false },
      "protocol1://host1/base1/",
    ),
    "protocol2://host2/base2/file.ext",
  ),
  true,
);

//////////
// glob //
//////////

// normal //

assertEqual(
  matchUrl(
    createMatcher({ glob: "*.ext" }, "protocol://host/base/"),
    "protocol://host/base/file.ext",
  ),
  true,
);

assertEqual(
  matchUrl(
    createMatcher({ glob: "*.ext" }, "protocol://host/base/"),
    "protocol://host/base/dir/file.ext",
  ),
  false,
);

assertEqual(
  matchUrl(
    createMatcher({ glob: "**/*.ext" }, "protocol://host/base/"),
    "protocol://host/base/dir/file.ext",
  ),
  true,
);

assertEqual(
  matchUrl(
    createMatcher({ glob: "**/*.js" }, "protocol://host/base/"),
    "protocol://host/base/../file.ext",
  ),
  false,
);

//////////
// Path //
//////////

// encoding //

assertEqual(
  matchUrl(
    createMatcher(
      { path: `][ ${encodeURIComponent("#?")}` },
      "protocol://host/base/",
    ),
    `protocol://host/base/${encodeURIComponent("][ #?")}`,
  ),
  true,
);

// deep >> file //

assertEqual(
  matchUrl(
    createMatcher({ path: "path", recursive: true }, "protocol://host/base/"),
    "protocol://host/base/path",
  ),
  true,
);

assertEqual(
  matchUrl(
    createMatcher({ path: "path", recursive: true }, "protocol://host/base/"),
    "protocol://host/base/path/file.ext",
  ),
  true,
);

assertEqual(
  matchUrl(
    createMatcher({ path: "path", recursive: true }, "protocol://host/base/"),
    "protocol://host/base/path/dir/file.ext",
  ),
  true,
);

// deep >> directory

assertEqual(
  matchUrl(
    createMatcher({ path: "path/", recursive: true }, "protocol://host/base/"),
    "protocol://host/base/path",
  ),
  false,
);

assertEqual(
  matchUrl(
    createMatcher({ path: "path/", recursive: true }, "protocol://host/base/"),
    "protocol://host/base/path/file.ext",
  ),
  true,
);

assertEqual(
  matchUrl(
    createMatcher({ path: "path/", recursive: true }, "protocol://host/base/"),
    "protocol://host/base/path/dir/file.ext",
  ),
  true,
);

// shallow >> file //

assertEqual(
  matchUrl(
    createMatcher({ path: "path", recursive: false }, "protocol://host/base/"),
    "protocol://host/base/path",
  ),
  true,
);

assertEqual(
  matchUrl(
    createMatcher({ path: "path", recursive: false }, "protocol://host/base/"),
    "protocol://host/base/path/file.ext",
  ),
  false,
);

assertEqual(
  matchUrl(
    createMatcher({ path: "path", recursive: false }, "protocol://host/base/"),
    "protocol://host/base/path/dir/file.ext",
  ),
  false,
);

// shallow >> directory //

assertEqual(
  matchUrl(
    createMatcher({ path: "path/", recursive: false }, "protocol://host/base/"),
    "protocol://host/base/path",
  ),
  false,
);

assertEqual(
  matchUrl(
    createMatcher({ path: "path/", recursive: false }, "protocol://host/base/"),
    "protocol://host/base/path/file.ext",
  ),
  true,
);

assertEqual(
  matchUrl(
    createMatcher({ path: "path/", recursive: false }, "protocol://host/base/"),
    "protocol://host/base/path/dir/file.ext",
  ),
  false,
);

/////////
// Url //
/////////

assertEqual(
  matchUrl(
    createMatcher(
      { url: "protocol1://host1/base1/file.ext", recursive: false },
      "protocol2://host2/base2/",
    ),
    "protocol1://host1/base1/file.ext",
  ),
  true,
);

assertEqual(
  matchUrl(
    createMatcher(
      { url: "protocol1://host1/base1/file.ext", recursive: false },
      "protocol2://host2/base2/",
    ),
    "protocol2://host2/base2/file.ext",
  ),
  false,
);

//////////
// Dist //
//////////

// normal //

assertEqual(
  matchUrl(
    createMatcher({ dist: "dist" }, "protocol://host/base/"),
    "protocol://host/base/node_modules/dist/file.ext",
  ),
  true,
);

// recursive //

assertEqual(
  matchUrl(
    createMatcher({ dist: "dist", recursive: false }, "protocol://host/base/"),
    "protocol://host/base/node_modules/dist/dir/file.ext",
  ),
  false,
);

assertEqual(
  matchUrl(
    createMatcher({ dist: "dist", recursive: true }, "protocol://host/base/"),
    "protocol://host/base/node_modules/dist/dir/file.ext",
  ),
  true,
);

// external //

assertEqual(
  matchUrl(
    createMatcher({ dist: "dist" }, "protocol://host/base/"),
    "protocol://host/node_modules/dist/file.ext",
  ),
  false,
);

assertEqual(
  matchUrl(
    createMatcher({ dist: "dist", external: true }, "protocol://host/base/"),
    "protocol://host/node_modules/dist/file.ext",
  ),
  true,
);

/////////////////////
// lookupUrl //
/////////////////////

assertEqual(
  lookupUrl([], "protocol://host/base/file.ext", "default_value"),
  "default_value",
);

assertEqual(
  lookupUrl(
    [[createMatcher({ regexp: "^file\\." }, "protocol://host/base/"), "value"]],
    "protocol://host/base/file.ext",
    "default_value",
  ),
  "value",
);
