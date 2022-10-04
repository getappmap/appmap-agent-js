import { assertDeepEqual, assertEqual } from "../../__fixture__.mjs";
import { createMirrorSourceMap } from "../../source/index.mjs?env=test";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs?env=test";
import { normalize } from "./__fixture__.mjs";
import {
  createInstrumentation,
  instrument,
  getInstrumentationIdentifier,
} from "./index.mjs?env=test";

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

const normalizeContent = ({ content, ...rest }, source) => ({
  content: normalize(content, source),
  ...rest,
});

const instrumentation = createInstrumentation(
  extendConfiguration(
    createConfiguration("file:///home"),
    {
      "hidden-identifier": "$",
      "inline-source": false,
      hooks: { eval: false },
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
    "file:///base",
  ),
);

assertEqual(getInstrumentationIdentifier(instrumentation), "$uuid");

{
  const file = {
    url: "file:///base/foo.js",
    content: "123;",
    type: "script",
  };
  assertDeepEqual(
    normalizeContent(
      instrument(instrumentation, file, createMirrorSourceMap(file)),
    ),
    {
      url: "file:///base/foo.js",
      content: normalize("123;", "script"),
      sources: [
        {
          url: "file:///base/foo.js",
          content: "123;",
          shallow: true,
          inline: true,
          exclude: [
            makeExclusion("foo"),
            makeExclusion("qux"),
            ...createConfiguration("file:///home").exclude,
          ],
        },
      ],
    },
  );
}

{
  const file = {
    url: "file:///base/bar.js",
    content: "456;",
    type: "script",
  };
  assertDeepEqual(
    normalizeContent(
      instrument(instrumentation, file, createMirrorSourceMap(file)),
    ),
    {
      url: "file:///base/bar.js",
      content: normalize("456;", "script"),
      sources: [],
    },
  );
}
