import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import { digest } from "../../hash/index.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import {
  createSource,
  isSourceEnabled,
  getSourceFile,
  parseSource,
  isSourceContentRequired,
  resolveClosureLocation,
} from "./source.mjs";

// disabled //
{
  const file = {
    url: "protocol://host/base/script.js",
    content: "function f () {}",
  };
  const source = createSource(
    file,
    extendConfiguration(
      createConfiguration("protocol://host/home/"),
      {
        "postmortem-function-exclusion": false,
        packages: [
          {
            path: "script.js",
            enabled: false,
          },
        ],
        "default-package": { enabled: true },
      },
      "protocol://host/base/",
    ),
  );
  assertEqual(isSourceEnabled(source), false);
  assertDeepEqual(getSourceFile(source), file);
  assertEqual(typeof parseSource(source), "object");
  assertEqual(isSourceContentRequired(source), false);
  assertDeepEqual(resolveClosureLocation(source, { line: 1, column: 0 }), null);
}

// enabled >> content is present //
for (const postmortem of [true, false, null]) {
  const url = "protocol://host/base/script.js";
  const content = "function f () {}\nfunction g () {}";
  const file = { url, content };
  const source = createSource(
    file,
    extendConfiguration(
      createConfiguration("protocol://host/home/"),
      {
        "postmortem-function-exclusion": postmortem,
        packages: [
          {
            path: "script.js",
            enabled: true,
            exclude: [
              { name: "^f$", excluded: false },
              { name: "^g$", excluded: true },
            ],
          },
        ],
        "default-package": { enabled: false },
      },
      "protocol://host/base/",
    ),
  );
  assertEqual(isSourceEnabled(source), true);
  assertEqual(isSourceContentRequired(source), postmortem === false);
  assertDeepEqual(getSourceFile(source), file);
  const hash = digest(content);
  assertDeepEqual(resolveClosureLocation(source, { line: 1, column: 1 }), {
    url,
    hash,
    position: { line: 1, column: postmortem === false ? 0 : 1 },
  });
  assertDeepEqual(
    resolveClosureLocation(source, { line: 2, column: 1 }),
    postmortem === false
      ? null
      : {
          url,
          hash,
          position: { line: 2, column: 1 },
        },
  );
  // The ast is cached and the source switch to live exclusion
  // mode if `postmortem-function-exclusion` was `null`.
  assertEqual(typeof parseSource(source), "object");
  assertDeepEqual(resolveClosureLocation(source, { line: 1, column: 1 }), {
    url,
    hash,
    position: { line: 1, column: postmortem === true ? 1 : 0 },
  });
  assertDeepEqual(
    resolveClosureLocation(source, { line: 2, column: 1 }),
    postmortem === true
      ? {
          url,
          hash,
          position: { line: 2, column: 1 },
        }
      : null,
  );
}

// enabled >> content is missing //
{
  const url = "protocol://host/base/script.js";
  const content = null;
  const file = { url, content };
  const source = createSource(
    file,
    extendConfiguration(
      createConfiguration("protocol://host/home/"),
      {
        "postmortem-function-exclusion": false,
        packages: [
          {
            path: "script.js",
            enabled: true,
          },
        ],
        "default-package": { enabled: false },
      },
      "protocol://host/base/",
    ),
  );
  assertEqual(isSourceEnabled(source), true);
  assertEqual(isSourceContentRequired(source), true);
  assertDeepEqual(getSourceFile(source), file);
  assertDeepEqual(resolveClosureLocation(source, { line: 123, column: 456 }), {
    url,
    hash: null,
    position: { line: 123, column: 456 },
  });
}
