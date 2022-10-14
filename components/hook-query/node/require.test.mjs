import { mkdir as mkdirAsync, writeFile as writeFileAsync } from "fs/promises";
import { assertEqual } from "../../__fixture__.mjs";

import { getTmpUrl } from "../../path/index.mjs?env=test";
import { getUuid } from "../../uuid/random/index.mjs?env=test";
import { toAbsoluteUrl } from "../../url/index.mjs?env=test";
import { requireMaybe } from "./require.mjs?env=test";

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
  requireMaybe(true, toAbsoluteUrl(`${uuid}/`, getTmpUrl()), "foo"),
  123,
);

assertEqual(
  requireMaybe(false, toAbsoluteUrl(`${uuid}/`, getTmpUrl()), "foo"),
  null,
);

assertEqual(
  requireMaybe(true, toAbsoluteUrl(`${uuid}/`, getTmpUrl()), getUuid()),
  null,
);
