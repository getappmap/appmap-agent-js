import {
  mkdir as mkdirAsync,
  writeFile as writeFileAsync,
} from "node:fs/promises";
import { assertEqual, assertThrow } from "../../__fixture__.mjs";
import { getTmpUrl } from "../../path/index.mjs";
import { getUuid } from "../../uuid/random/index.mjs";
import { toAbsoluteUrl } from "../../url/index.mjs";
import { requirePeerDependency } from "./index.mjs";

const {
  URL,
  JSON: { stringify: stringifyJSON },
} = globalThis;

const uuid = getUuid();

await mkdirAsync(new URL(`${uuid}/node_modules/foo`, getTmpUrl()), {
  recursive: true,
});

await writeFileAsync(
  new URL(`${uuid}/node_modules/foo/package.json`, getTmpUrl()),
  stringifyJSON({
    name: "foo",
    version: "1.2.3",
  }),
  "utf8",
);

await writeFileAsync(
  new URL(`${uuid}/node_modules/foo/index.js`, getTmpUrl()),
  "module.exports = 123;",
  "utf8",
);

assertEqual(
  requirePeerDependency("foo", {
    directory: toAbsoluteUrl(`${uuid}/`, getTmpUrl()),
    strict: true,
  }),
  123,
);

assertEqual(
  requirePeerDependency(getUuid(), {
    directory: toAbsoluteUrl(`${uuid}/`, getTmpUrl()),
    strict: false,
  }),
  null,
);

assertThrow(
  () =>
    requirePeerDependency(getUuid(), {
      directory: toAbsoluteUrl(`${uuid}/`, getTmpUrl()),
      strict: true,
    }),
  /^ExternalAppmapError: Could not load peer dependency$/u,
);
