import {
  mkdir as mkdirAsync,
  writeFile as writeFileAsync,
  realpath as realpathAsync,
} from "fs/promises";
import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import { getUuid } from "../../uuid/random/index.mjs?env=test";
import { toAbsoluteUrl } from "../../url/index.mjs?env=test";
import { getTmpUrl, convertPathToFileUrl } from "../../path/index.mjs?env=test";
import {
  extractRepositoryPackage,
  extractRepositoryDependency,
} from "./index.mjs?env=test";

const { URL } = globalThis;

const url = toAbsoluteUrl(`${getUuid()}/`, getTmpUrl());
await mkdirAsync(new URL(url));

assertEqual(extractRepositoryPackage(url), null);

await writeFileAsync(new URL("package.json", url), "invalid-json", "utf8");
assertEqual(extractRepositoryPackage(url), null);

await writeFileAsync(new URL("package.json", url), "{}", "utf8");
assertEqual(extractRepositoryPackage(url), null);

await writeFileAsync(new URL("package.json", url), '{"name":"foo"}', "utf8");
assertEqual(extractRepositoryPackage(url), null);

await writeFileAsync(
  new URL("package.json", url),
  '{"name":"foo", "version":"bar"}',
  "utf8",
);
assertDeepEqual(extractRepositoryPackage(url), {
  name: "foo",
  version: "bar",
  homepage: null,
});

await writeFileAsync(
  new URL("package.json", url),
  '{"name":"foo", "version":"bar", "homepage":"qux"}',
  "utf8",
);
assertDeepEqual(extractRepositoryPackage(url), {
  name: "foo",
  version: "bar",
  homepage: "qux",
});

await writeFileAsync(
  new URL("package.json", url),
  '{"name":"foo", "version":"1.2.3", "dependencies":{"bar":"4.5.6"}}',
  "utf8",
);
await mkdirAsync(new URL("node_modules", url));
await mkdirAsync(new URL("node_modules/bar", url));
await writeFileAsync(
  new URL("node_modules/bar/package.json", url),
  '{"name":"bar", "version":"4.5.6", "main":"lib/index.js"}',
  "utf8",
);
await mkdirAsync(new URL("node_modules/bar/lib", url));
await writeFileAsync(
  new URL("node_modules/bar/lib/index.js", url),
  "789;",
  "utf8",
);

assertDeepEqual(extractRepositoryDependency(url, "bar"), {
  directory: `${convertPathToFileUrl(
    await realpathAsync(new URL(url)),
  )}/node_modules/bar/`,
  package: {
    name: "bar",
    version: "4.5.6",
    homepage: null,
  },
});
