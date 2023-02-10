import { assertEqual } from "../../__fixture__.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import { createSource } from "../../source/index.mjs";
import {
  createExclusion,
  addExclusionSource,
  isExcluded,
} from "./exclusion.mjs";

// basic frontend exclusion //
{
  const exclusion = createExclusion(
    extendConfiguration(
      createConfiguration("protocol://host/home/"),
      {
        "postmortem-function-exclusion": true,
        packages: [
          {
            path: "enabled.js",
            enabled: true,
          },
          {
            path: "disable.js",
            enabled: false,
          },
        ],
      },
      "protocol://host/base/",
    ),
  );

  assertEqual(
    addExclusionSource(
      exclusion,
      createSource("protocol://host/base/enabled.js", null),
    ),
    true,
  );

  assertEqual(
    addExclusionSource(
      exclusion,
      createSource("protocol://host/base/disabled.js", null),
    ),
    false,
  );

  assertEqual(
    isExcluded(exclusion, {
      hash: null,
      url: "protocol://host/base/enabled.js",
      line: 123,
      column: 456,
    }),
    false,
  );

  assertEqual(
    isExcluded(exclusion, {
      hash: null,
      url: "protocol://host/base/disabled.js",
      line: 123,
      column: 456,
    }),
    true,
  );
}

// classmap frontend exclusion //
for (const postmortem of [true, false]) {
  const exclusion = createExclusion(
    extendConfiguration(
      createConfiguration("protocol://host/home/"),
      {
        "postmortem-function-exclusion": postmortem,
        packages: [
          {
            path: "enabled.js",
            enabled: true,
            exclude: [{ name: "f" }],
          },
        ],
      },
      "protocol://host/base/",
    ),
  );

  assertEqual(
    addExclusionSource(
      exclusion,
      createSource(
        "protocol://host/base/enabled.js",
        `
        function f () {}
        function g () {}
      `,
      ),
    ),
    true,
  );

  assertEqual(
    isExcluded(exclusion, {
      hash: null,
      url: "protocol://host/base/enabled.js",
      line: 2,
      column: 10,
    }),
    !postmortem,
  );

  assertEqual(
    isExcluded(exclusion, {
      hash: null,
      url: "protocol://host/base/enabled.js",
      line: 3,
      column: 10,
    }),
    false,
  );
}
