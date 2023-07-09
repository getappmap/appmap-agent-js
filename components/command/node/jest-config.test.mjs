import {
  mkdir as mkdirAsync,
  writeFile as writeFileAsync,
} from "node:fs/promises";
import { assertDeepEqual, assertReject } from "../../__fixture__.mjs";
import { getTmpUrl } from "../../path/index.mjs";
import { getUuid } from "../../uuid/random/index.mjs";
import { toAbsoluteUrl } from "../../url/index.mjs";
import { loadJestConfigAsync, resolveJestPresetAsync } from "./jest-config.mjs";

const { URL } = globalThis;

const home = toAbsoluteUrl(`${getUuid()}/`, getTmpUrl());
await mkdirAsync(new URL(home));

// Explicit >> Missing //
await assertReject(
  loadJestConfigAsync(
    {
      config: "missing.config.json",
    },
    {
      base: home,
      root: "file:///A:/root/",
    },
  ),
  /^ExternalAppmapError: Failed to load jest configuration file$/u,
);

// Implicit >> Missing //
assertDeepEqual(
  await loadJestConfigAsync(
    {},
    {
      base: "file:///A:/base/",
      root: home,
    },
  ),
  {},
);

// Explicit >> Present //
await writeFileAsync(
  new URL("valid.config.json", home),
  `{"filename": "valid.config.json"}`,
  "utf8",
);
assertDeepEqual(
  await loadJestConfigAsync(
    {
      config: "valid.config.json",
    },
    {
      base: home,
      root: "file:///A:/root/",
    },
  ),
  { filename: "valid.config.json" },
);

// Implicit >> Present //
await writeFileAsync(
  new URL("jest.config.json", home),
  `{"filename": "jest.config.json"}`,
  "utf8",
);
assertDeepEqual(
  await loadJestConfigAsync(
    {},
    {
      base: "file://A:/base/",
      root: home,
    },
  ),
  { filename: "jest.config.json" },
);

// Package >> Invalid //

await writeFileAsync(new URL("package.json", home), `invalid json`, "utf8");

await assertReject(
  loadJestConfigAsync(
    {},
    {
      base: "file:///A:/base/",
      root: home,
    },
  ),
  /^ExternalAppmapError: Could not load package.json/u,
);

// Package >> Valid //

await writeFileAsync(
  new URL("package.json", home),
  `{ "jest": { "filename": "package.json" } }`,
  "utf8",
);

assertDeepEqual(
  await loadJestConfigAsync(
    {},
    {
      base: "file:///A:/base/",
      root: home,
    },
  ),
  { filename: "package.json" },
);

////////////
// Preset //
////////////

await assertReject(
  resolveJestPresetAsync({ preset: "./missing-jest-preset.json" }, home),
  /^ExternalAppmapError: Failed to load jest configuration file$/u,
);

await assertReject(
  resolveJestPresetAsync({ preset: "missing-jest-preset" }, home),
  /^ExternalAppmapError: Could not resolve jest preset$/u,
);

await mkdirAsync(new URL("node_modules/preset", home), { recursive: true });

await writeFileAsync(
  new URL("node_modules/preset/jest-preset.js", home),
  `
    const { basename } = require("node:path");
    module.exports = { filename: basename(__filename) };
  `,
  "utf8",
);

assertDeepEqual(
  await resolveJestPresetAsync({ preset: "preset", foo: "bar" }, home),
  { foo: "bar", filename: "jest-preset.js", preset: null },
);

assertDeepEqual(await resolveJestPresetAsync({ foo: "bar" }, home), {
  foo: "bar",
});
