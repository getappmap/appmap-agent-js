import SourceMap from "source-map";
import {
  assertEqual,
  assertDeepEqual,
  assertThrow,
} from "../../__fixture__.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import { digest } from "../../hash/index.mjs";
import {
  extractMissingUrlArray,
  createCodebase,
  getEnabledSourceFileArray,
  getMainFile,
  parseMain,
  resolveClosureLocation,
} from "./codebase.mjs";

const {
  Map,
  JSON: { stringify: stringifyJSON },
} = globalThis;

const { SourceMapGenerator } = SourceMap;

//////////////////////////////////////////////
// extractMissingUrlArray && createCodebase //
//////////////////////////////////////////////

const testCreation = (url, cache, configuration, missing_url_array) => {
  assertDeepEqual(
    extractMissingUrlArray(url, cache, configuration),
    missing_url_array,
  );
  assertEqual(typeof createCodebase(url, cache, configuration), "object");
};

// missing main content >> cache miss //
assertThrow(
  () =>
    testCreation(
      "http://host/directory/script.js",
      new Map([]),
      createConfiguration("http://host/home/"),
      ["http://host/directory/script.js"],
    ),
  /^InternalAppmapError: missing main content$/u,
);

// missing main content >> cache null //
assertThrow(
  () =>
    testCreation(
      "http://host/directory/script.js",
      new Map([["http://host/directory/script.js", null]]),
      createConfiguration("http://host/home/"),
      [],
    ),
  /^ExternalAppmapError: missing main content$/u,
);

// no sourcemap //
testCreation(
  "http://host/directory/script.js",
  new Map([["http://host/directory/script.js", "123;"]]),
  createConfiguration("http://host/home/"),
  [],
);

// missing sourcemap >> cache miss //
testCreation(
  "http://host/directory/script.js",
  new Map([
    [
      "http://host/directory/script.js",
      "123; //# sourceMappingURL=sourcemap.json",
    ],
  ]),
  createConfiguration("http://host/home/"),
  ["http://host/directory/sourcemap.json"],
);

// missing sourcemap >> cache null //
testCreation(
  "http://host/directory/script.js",
  new Map([
    [
      "http://host/directory/script.js",
      "123; //# sourceMappingURL=sourcemap.json",
    ],
    ["http://host/directory/sourcemap.json", null],
  ]),
  createConfiguration("http://host/home/"),
  [],
);

// invalid sourcemap //
testCreation(
  "http://host/directory/script.js",
  new Map([
    [
      "http://host/directory/script.js",
      "123; //# sourceMappingURL=sourcemap.json",
    ],
    ["http://host/directory/sourcemap.json", "INVALID SOURCE MAP"],
  ]),
  createConfiguration("http://host/home/"),
  [],
);

// missing source //
testCreation(
  "http://host/directory/script.js",
  new Map([
    [
      "http://host/directory/script.js",
      "123; //# sourceMappingURL=sourcemap.json",
    ],
    [
      "http://host/directory/sourcemap.json",
      stringifyJSON({
        version: 3,
        file: "script.js",
        sources: ["source1.js", "source2.js", "source3.js"],
        sourcesContent: [null, "456;", "789;"],
        names: [],
        mappings: "A,AAAB;;ABCDE;",
      }),
    ],
  ]),
  extendConfiguration(
    createConfiguration("http://host/home/"),
    {
      "postmortem-function-exclusion": false,
      packages: [
        { path: "source1.js", enabled: true },
        { path: "source2.js", enabled: true },
        { path: "source3.js", enabled: false },
      ],
    },
    "http://host/directory/",
  ),
  ["http://host/directory/source1.js"],
);

////////////////////
// createCodebase //
////////////////////

// disabled && direct //
{
  const codebase = createCodebase(
    "http://host/base/script.js",
    new Map([["http://host/base/script.js", "123;"]]),
    extendConfiguration(
      createConfiguration("http://host/home"),
      {
        packages: [
          {
            path: "script.js",
            enabled: false,
          },
        ],
      },
      "http://host/base/",
    ),
  );
  assertDeepEqual(getEnabledSourceFileArray(codebase), []);
  assertDeepEqual(getMainFile(codebase), {
    url: "http://host/base/script.js",
    content: "123;",
  });
  assertEqual(typeof parseMain(codebase), "object");
  assertEqual(
    resolveClosureLocation(codebase, { line: 123, column: 456 }),
    null,
  );
}

// mapped //
{
  const generator = new SourceMapGenerator();
  generator.addMapping({
    source: "source.js",
    generated: { line: 11, column: 0 },
    original: { line: 1, column: 0 },
  });
  generator.addMapping({
    source: "source.js",
    generated: { line: 12, column: 0 },
    original: { line: 2, column: 0 },
  });
  const codebase = createCodebase(
    "http://host/base/script.js",
    new Map([
      [
        "http://host/base/script.js",
        "123; //# sourceMappingURL=sourcemap.json",
      ],
      ["http://host/base/sourcemap.json", generator.toString()],
      ["http://host/base/source.js", "function f () {}\nfunction g () {}"],
    ]),
    extendConfiguration(
      createConfiguration("http://host/home"),
      {
        "postmortem-function-exclusion": false,
        packages: [
          {
            path: "source.js",
            enabled: true,
            exclude: [
              { name: "^f$", excluded: false },
              { name: "^g$", excluded: true },
            ],
          },
          {
            path: "script.js",
            enabled: false,
          },
        ],
      },
      "http://host/base/",
    ),
  );
  assertDeepEqual(getEnabledSourceFileArray(codebase), [
    {
      url: "http://host/base/source.js",
      content: "function f () {}\nfunction g () {}",
    },
  ]);
  assertDeepEqual(getMainFile(codebase), {
    url: "http://host/base/script.js",
    content: "123; //# sourceMappingURL=sourcemap.json",
  });
  assertEqual(typeof parseMain(codebase), "object");
  // included function //
  assertDeepEqual(resolveClosureLocation(codebase, { line: 11, column: 0 }), {
    url: "http://host/base/source.js",
    hash: digest("function f () {}\nfunction g () {}"),
    position: { line: 1, column: 0 },
  });
  // excluded function //
  assertDeepEqual(
    resolveClosureLocation(codebase, { line: 12, column: 0 }),
    null,
  );
  // unmapped position //
  assertDeepEqual(
    resolveClosureLocation(codebase, { line: 13, column: 0 }),
    null,
  );
}
