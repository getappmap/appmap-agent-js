import {
  mkdir as mkdirAsync,
  writeFile as writeFileAsync,
} from "node:fs/promises";
import { assertDeepEqual, assertReject } from "../../__fixture__.mjs";
import { getTmpUrl, convertFileUrlToPath } from "../../path/index.mjs";
import { self_directory } from "../../self/index.mjs";
import { getUuid } from "../../uuid/random/index.mjs";
import { toAbsoluteUrl } from "../../url/index.mjs";
import { hookJestArgvAsync } from "./jest-argv.mjs";

const {
  URL,
  JSON: { stringify: stringifyJSON },
} = globalThis;

const hook = convertFileUrlToPath(
  toAbsoluteUrl("lib/node/transformer-jest.mjs", self_directory),
);

await assertReject(
  hookJestArgvAsync(["--transform", "invalid-json"], "file:///A:/base/"),
  /ExternalAppmapError: Jest --transform argument should be a json string/u,
);

assertDeepEqual(
  await hookJestArgvAsync(
    [
      "--key1",
      "value1",
      "--transform",
      `{ "regexp": ["specifier", "options"] }`,
      "--key2",
      "value2",
    ],
    "file:///A:/base/",
  ),
  [
    "--key1",
    "value1",
    "--transform",
    stringifyJSON({
      "^": [
        hook,
        {
          regexp: {
            specifier: "specifier",
            options: "options",
          },
        },
      ],
    }),
    "--key2",
    "value2",
  ],
);

{
  const dirname = getUuid();
  await mkdirAsync(new URL(dirname, getTmpUrl()));
  await writeFileAsync(
    new URL(`${dirname}/jest.config.json`, getTmpUrl()),
    stringifyJSON({
      transform: {
        regexp: "specifier",
      },
    }),
    "utf8",
  );
  assertDeepEqual(
    await hookJestArgvAsync(["--rootDir", dirname], getTmpUrl()),
    [
      "--rootDir",
      dirname,
      "--transform",
      stringifyJSON({
        "^": [
          hook,
          {
            regexp: {
              specifier: "specifier",
              options: {},
            },
          },
        ],
      }),
    ],
  );
}

{
  const filename = `${getUuid()}.json`;
  await writeFileAsync(
    new URL(filename, getTmpUrl()),
    stringifyJSON({}),
    "utf8",
  );
  assertDeepEqual(
    await hookJestArgvAsync(["--config", filename], getTmpUrl()),
    [
      "--config",
      filename,
      "--transform",
      stringifyJSON({
        "^": [
          hook,
          {
            "\\.[jt]sx?$": {
              specifier: "babel-jest",
              options: {},
            },
          },
        ],
      }),
    ],
  );
}
