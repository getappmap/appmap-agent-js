import {
  assertDeepEqual,
  assertEqual,
  makeAbsolutePath,
} from "../../__fixture__.mjs";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Instrumentation from "./index.mjs";

const { createMirrorSourceMap } = await buildTestComponentAsync("source");
const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration");
const { createInstrumentation, instrument, getInstrumentationIdentifier } =
  Instrumentation(await buildTestDependenciesAsync(import.meta.url));

const and_exclusion = {
  combinator: "and",
  name: true,
  "qualified-name": true,
  "every-label": true,
  "some-label": true,
  excluded: false,
  recursive: false,
};

const makeExclusion = (name) => ({
  ...and_exclusion,
  "qualified-name": name,
  excluded: true,
  recursive: true,
});

const instrumentation = createInstrumentation(
  extendConfiguration(
    createConfiguration(makeAbsolutePath()),
    {
      "hidden-identifier": "$",
      language: { name: "ecmascript", version: "2020" },
      "inline-source": false,
      packages: [
        {
          path: "foo.js",
          enabled: true,
          exclude: ["foo"],
          shallow: true,
          "inline-source": true,
        },
        {
          path: "bar.js",
          enabled: false,
          exclude: ["bar"],
          shallow: false,
          "inline-source": false,
        },
      ],
      exclude: ["qux"],
    },
    makeAbsolutePath("cwd"),
  ),
);

assertEqual(getInstrumentationIdentifier(instrumentation), "$uuid");

{
  const file = {
    url: "file:///cwd/foo.js",
    content: "123;",
    type: "script",
  };
  assertDeepEqual(
    instrument(instrumentation, file, createMirrorSourceMap(file)),
    {
      url: "file:///cwd/foo.js",
      content: "123;",
      sources: [
        {
          url: "file:///cwd/foo.js",
          content: "123;",
          shallow: true,
          inline: true,
          exclude: [
            makeExclusion("foo"),
            makeExclusion("qux"),
            ...createConfiguration(makeAbsolutePath("base")).exclude,
          ],
        },
      ],
    },
  );
}

{
  const file = {
    url: "file:///cwd/bar.js",
    content: "456;",
    type: "script",
  };
  assertDeepEqual(
    instrument(instrumentation, file, createMirrorSourceMap(file)),
    {
      url: "file:///cwd/bar.js",
      content: "456;",
      sources: [],
    },
  );
}
