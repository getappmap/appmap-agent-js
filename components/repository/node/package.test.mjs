import { mkdir as mkdirAsync, writeFile as writeFileAsync } from "fs/promises";
import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import { getUuid } from "../../uuid/random/index.mjs?env=test";
import { toAbsoluteUrl } from "../../url/index.mjs?env=test";
import { getTmpUrl } from "../../path/index.mjs?env=test";
import {
  // extractRepositoryHistory,
  extractRepositoryPackage,
} from "./index.mjs?env=test";

const { URL } = globalThis;

const url = toAbsoluteUrl(`${getUuid()}/`, getTmpUrl());
await mkdirAsync(new URL(url));

//////////////////////////////
// extractRepositoryPackage //
//////////////////////////////

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
