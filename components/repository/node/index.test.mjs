import {
  mkdir as mkdirAsync,
  writeFile as writeFileAsync,
  realpath as realpathAsync,
} from "fs/promises";
import { pathToFileURL } from "url";
import {
  assertEqual,
  assertDeepEqual,
  getFreshTemporaryURL,
} from "../../__fixture__.mjs";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Repository from "./index.mjs";

const { URL } = globalThis;

const { extractRepositoryPackage, extractRepositoryDependency } = Repository(
  await buildTestDependenciesAsync(import.meta.url),
);

const url = getFreshTemporaryURL();
await mkdirAsync(new URL(url));

assertEqual(extractRepositoryPackage(url), null);

await writeFileAsync(new URL(`${url}/package.json`), "invalid-json", "utf8");
assertEqual(extractRepositoryPackage(url), null);

await writeFileAsync(new URL(`${url}/package.json`), "{}", "utf8");
assertEqual(extractRepositoryPackage(url), null);

await writeFileAsync(new URL(`${url}/package.json`), '{"name":"foo"}', "utf8");
assertEqual(extractRepositoryPackage(url), null);

await writeFileAsync(
  new URL(`${url}/package.json`),
  '{"name":"foo", "version":"bar"}',
  "utf8",
);
assertDeepEqual(extractRepositoryPackage(url), {
  name: "foo",
  version: "bar",
  homepage: null,
});

await writeFileAsync(
  new URL(`${url}/package.json`),
  '{"name":"foo", "version":"bar", "homepage":"qux"}',
  "utf8",
);
assertDeepEqual(extractRepositoryPackage(url), {
  name: "foo",
  version: "bar",
  homepage: "qux",
});

await writeFileAsync(
  new URL(`${url}/package.json`),
  '{"name":"foo", "version":"1.2.3", "dependencies":{"bar":"4.5.6"}}',
  "utf8",
);
await mkdirAsync(new URL(`${url}/node_modules`));
await mkdirAsync(new URL(`${url}/node_modules/bar`));
await writeFileAsync(
  new URL(`${url}/node_modules/bar/package.json`),
  '{"name":"bar", "version":"4.5.6", "main":"lib/index.js"}',
  "utf8",
);
await mkdirAsync(new URL(`${url}/node_modules/bar/lib`));
await writeFileAsync(
  new URL(`${url}/node_modules/bar/lib/index.js`),
  "789;",
  "utf8",
);

assertDeepEqual(extractRepositoryDependency(url, ["bar"]), {
  directory: `${pathToFileURL(
    await realpathAsync(new URL(url)),
  )}/node_modules/bar/`,
  package: {
    name: "bar",
    version: "4.5.6",
    homepage: null,
  },
});
