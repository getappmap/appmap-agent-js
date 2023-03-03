import { assertDeepEqual } from "../../__fixture__.mjs";
import { createMirrorMapping } from "../../mapping/index.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import { createSource } from "../../source/index.mjs";
import { normalize } from "./__fixture__.mjs";
import { createInstrumentation, instrument } from "./index.mjs";

const normalizeContent = ({ content, ...rest }, source) => ({
  content: normalize(content, source),
  ...rest,
});

{
  const source = createSource(
    "protocol://host/base/script.js",
    "function main () {}",
  );
  assertDeepEqual(
    instrument(
      createInstrumentation(
        extendConfiguration(
          createConfiguration("protocol://host/home/"),
          {
            "postmortem-function-exclusion": true,
            "inline-source": false,
            hooks: { apply: null, eval: false },
            packages: [
              {
                path: "script.js",
                enabled: true,
              },
            ],
          },
          "protocol://host/base/",
        ),
      ),
      source,
      createMirrorMapping(source),
    ),
    {
      url: "protocol://host/base/script.js",
      content: "function main () {}",
      sources: [source],
    },
  );
}

const instrumentation = createInstrumentation(
  extendConfiguration(
    createConfiguration("protocol://host/home/"),
    {
      "postmortem-function-exclusion": true,
      "inline-source": false,
      hooks: { apply: "$", eval: false },
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
    "protocol://host/base/",
  ),
);

{
  const source = createSource("protocol://host/base/foo.js", "123;");
  assertDeepEqual(
    normalizeContent(
      instrument(instrumentation, source, createMirrorMapping(source)),
    ),
    {
      url: "protocol://host/base/foo.js",
      content: normalize("123;", "script"),
      sources: [source],
    },
  );
}

{
  const js = "class Klass { prop; }";
  const source = createSource("protocol://host/base/foo.js", js);
  assertDeepEqual(
    normalizeContent(
      instrument(instrumentation, source, createMirrorMapping(source)),
    ),
    {
      url: "protocol://host/base/foo.js",
      content: normalize(js, "script"),
      sources: [source],
    },
  );
}

{
  const source = createSource("protocol://host/base/bar.js", "456;");
  assertDeepEqual(
    normalizeContent(
      instrument(instrumentation, source, createMirrorMapping(source)),
    ),
    {
      url: "protocol://host/base/bar.js",
      content: normalize("456;", "script"),
      sources: [],
    },
  );
}
