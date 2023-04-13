import {
  assertEqual,
  assertNotEqual,
  assertDeepEqual,
} from "../../__fixture__.mjs";
import {
  extendConfiguration,
  createConfiguration,
} from "../../configuration/index.mjs";
import { instrument } from "./index.mjs";

const { Map } = globalThis;

for (const enabled of [true, false]) {
  const { url, content, messages } = instrument(
    "http://host/directory/script.js",
    new Map([["http://host/directory/script.js", "function f () {}"]]),
    extendConfiguration(
      createConfiguration("http://host/directory/home/"),
      {
        packages: [{ path: "script.js", enabled }],
      },
      "http://host/directory/",
    ),
  );
  assertEqual(url, "http://host/directory/script.js");
  if (enabled) {
    assertNotEqual(content, "function f () {}");
  } else {
    assertEqual(content, "function f () {}");
  }
  assertDeepEqual(
    messages,
    enabled
      ? [
          {
            type: "source",
            url: "http://host/directory/script.js",
            content: "function f () {}",
          },
        ]
      : [],
  );
}
