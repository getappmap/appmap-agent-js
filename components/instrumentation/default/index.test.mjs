import { assertDeepEqual } from "../../__fixture__.mjs";
import { createMirrorMapping } from "../../mapping/index.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import { normalize } from "./__fixture__.mjs";
import { instrument } from "./index.mjs";

const normalizeContent = ({ content, ...rest }, source) => ({
  content: normalize(content, source),
  ...rest,
});

{
  const source = {
    url: "protocol://host/base/script.js",
    content: "function main () {}",
  };
  assertDeepEqual(
    instrument(
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
      source,
      createMirrorMapping(source),
    ),
    {
      url: "protocol://host/base/script.js",
      content: "function main () {}",
      messages: [{ type: "source", ...source }],
    },
  );
}

const configuration = extendConfiguration(
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
);

{
  const source = { url: "protocol://host/base/foo.js", content: "123;" };
  assertDeepEqual(
    normalizeContent(
      instrument(configuration, source, createMirrorMapping(source)),
    ),
    {
      url: "protocol://host/base/foo.js",
      content: normalize("123;", "script"),
      messages: [{ type: "source", ...source }],
    },
  );
}

{
  const js = "class Klass { prop; }";
  const source = { url: "protocol://host/base/foo.js", content: js };
  assertDeepEqual(
    normalizeContent(
      instrument(configuration, source, createMirrorMapping(source)),
    ),
    {
      url: "protocol://host/base/foo.js",
      content: normalize(js, "script"),
      messages: [{ type: "source", ...source }],
    },
  );
}

{
  const source = { url: "protocol://host/base/bar.js", content: "456;" };
  assertDeepEqual(
    normalizeContent(
      instrument(configuration, source, createMirrorMapping(source)),
    ),
    {
      url: "protocol://host/base/bar.js",
      content: normalize("456;", "script"),
      messages: [],
    },
  );
}
