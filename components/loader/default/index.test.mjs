/* global APPMAP_TRANSFORM_MODULE_ASYNC:writable */

import { strict as Assert } from "assert";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Loader from "./index.mjs";

const {
  equal: assertEqual,
  deepEqual: assertDeepEqual,
  throws: assertThrows,
} = Assert;

const { createLoaderHooks } = Loader(
  await buildTestDependenciesAsync(import.meta.url),
);

const { stringifyModule, transformSourceAsync, loadAsync } =
  createLoaderHooks();

assertEqual(APPMAP_TRANSFORM_MODULE_ASYNC, null);

APPMAP_TRANSFORM_MODULE_ASYNC = async (url, content) =>
  `/* ${url} */ ${content}`;

// transformSourceAsync //
{
  const transformSourceDefaultAsync = (content, context, self) => {
    assertEqual(self, transformSourceDefaultAsync);
    return { source: content };
  };
  assertDeepEqual(
    await transformSourceAsync(
      "123;",
      { format: "module", url: "file:///main.mjs" },
      transformSourceDefaultAsync,
    ),
    { source: "/* file:///main.mjs */ 123;" },
  );
  assertDeepEqual(
    await transformSourceAsync(
      "123;",
      { format: "foobar", url: "file:///main.mjs" },
      transformSourceDefaultAsync,
    ),
    { source: "123;" },
  );
}

// loadAsync //
{
  const loadDefaultAsync = (url, { format }, self) => {
    assertEqual(self, loadDefaultAsync);
    return { format, source: "123;" };
  };
  assertDeepEqual(
    await loadAsync("file:///main.mjs", { format: "module" }, loadDefaultAsync),
    { format: "module", source: "/* file:///main.mjs */ 123;" },
  );
  assertDeepEqual(
    await loadAsync("file:///main.mjs", { format: "foobar" }, loadDefaultAsync),
    { format: "foobar", source: "123;" },
  );
}

// stringifyModule //
assertEqual(stringifyModule("123;"), "123;");
{
  const content = "123;";
  const view = new Uint8Array(content.length);
  for (let index = 0; index < content.length; index += 1) {
    view[index] = "123;".charCodeAt(index);
  }
  assertEqual(stringifyModule(view), content);
}
assertThrows(() => stringifyModule(123));
