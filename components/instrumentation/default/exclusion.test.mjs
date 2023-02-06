import { assertEqual } from "../../__fixture__.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
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
        "late-exclusion": true,
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
    addExclusionSource(exclusion, {
      url: "protocol://host/base/enabled.js",
      content: null,
    }),
    true,
  );

  assertEqual(
    addExclusionSource(exclusion, {
      url: "protocol://host/base/disabled.js",
      content: null,
    }),
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
{
  const exclusion = createExclusion(
    extendConfiguration(
      createConfiguration("protocol://host/home/"),
      {
        "late-exclusion": false,
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
    addExclusionSource(exclusion, {
      url: "protocol://host/base/enabled.js",
      content: `
        function f () {}
        function g () {}
      `,
    }),
    true,
  );

  assertEqual(
    isExcluded(exclusion, {
      hash: null,
      url: "protocol://host/base/enabled.js",
      line: 2,
      column: 10,
    }),
    true,
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
