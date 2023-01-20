import {
  mkdir as mkdirAsync,
  writeFile as writeFileAsync,
} from "node:fs/promises";
import { assertDeepEqual, assertReject } from "../../__fixture__.mjs";
import { getTmpUrl } from "../../path/index.mjs";
import { getUuid } from "../../uuid/random/index.mjs";
import { toAbsoluteUrl } from "../../url/index.mjs";
import { loadJestConfigAsync } from "./jest-config.mjs";

const { URL } = globalThis;

const home = toAbsoluteUrl(`${getUuid()}/`, getTmpUrl());
await mkdirAsync(new URL(home));

//////////////////////
// Explicit >> JSON //
//////////////////////

// Missing //

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
  /^ExternalAppmapError: Cannot find jest configuration file$/u,
);

// Invalid //

await writeFileAsync(
  new URL("invalid.config.json", home),
  "invalid-json",
  "utf8",
);

await assertReject(
  loadJestConfigAsync(
    {
      config: "invalid.config.json",
    },
    {
      base: home,
      root: "file:///A:/root/",
    },
  ),
  /^ExternalAppmapError: Failed to load jest configuration file$/u,
);

// Valid //

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

/////////////////////
// Explicit >> CJS //
/////////////////////

// Missing //

await assertReject(
  loadJestConfigAsync(
    {
      config: "missing.config.cjs",
    },
    {
      base: home,
      root: "file:///A:/root/",
    },
  ),
  /^ExternalAppmapError: Cannot find jest configuration file$/u,
);

// Invalid //

await writeFileAsync(
  new URL("invalid.config.cjs", home),
  "invalid cjs",
  "utf8",
);

await assertReject(
  loadJestConfigAsync(
    {
      config: "invalid.config.cjs",
    },
    {
      base: home,
      root: "file:///A:/root/",
    },
  ),
  /^ExternalAppmapError: Failed to load jest configuration file$/u,
);

// Valid //

await writeFileAsync(
  new URL("valid.config.cjs", home),
  `
    const { basename } = require("node:path");
    module.exports = { filename: basename(__filename) };
  `,
  "utf8",
);

assertDeepEqual(
  await loadJestConfigAsync(
    {
      config: "valid.config.cjs",
    },
    {
      base: home,
      root: "file:///A:/root/",
    },
  ),
  { filename: "valid.config.cjs" },
);

////////////////////
// Explict >> ESM //
////////////////////

// Missing //

await assertReject(
  loadJestConfigAsync(
    {
      config: "missing.config.esm",
    },
    {
      base: home,
      root: "file:///A:/root/",
    },
  ),
  /^ExternalAppmapError: Cannot find jest configuration file$/u,
);

// Invalid //

await writeFileAsync(
  new URL("invalid.config.mjs", home),
  "invalid esm",
  "utf8",
);

await assertReject(
  loadJestConfigAsync(
    {
      config: "invalid.config.mjs",
    },
    {
      base: home,
      root: "file:///A:/root/",
    },
  ),
  /^ExternalAppmapError: Failed to load jest configuration file$/u,
);

// Valid //

await writeFileAsync(
  new URL("valid.config.mjs", home),
  `
    import { basename } from "node:path";
    import { fileURLToPath } from "node:url";
    export default () => ({
      filename: basename(fileURLToPath(import.meta.url)),
    });
  `,
  "utf8",
);

assertDeepEqual(
  await loadJestConfigAsync(
    {
      config: "valid.config.mjs",
    },
    {
      base: home,
      root: "file:///A:/root/",
    },
  ),
  { filename: "valid.config.mjs" },
);

//////////////
// Implicit //
//////////////

// Missing //

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

// Config //

await writeFileAsync(
  new URL("jest.config.json", home),
  `{"filename": "jest.config.json"}`,
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
  /^ExternalAppmapError: Could not load package.json$/u,
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
