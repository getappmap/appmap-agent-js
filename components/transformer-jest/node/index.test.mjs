import { writeFile as writeFileAsync } from "node:fs/promises";
import { assertDeepEqual, assertMatch } from "../../__fixture__.mjs";
import { getUuid } from "../../uuid/random/index.mjs";
import { toAbsoluteUrl } from "../../url/index.mjs";
import { convertFileUrlToPath, getTmpUrl } from "../../path/index.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import { compileCreateTransformer } from "./index.mjs";

const {
  URL,
  Reflect: { get },
} = globalThis;

//////////////////////////////////////////////
// CJS && No SourceMap && With processAsync //
//////////////////////////////////////////////

{
  const specifier = toAbsoluteUrl(`${getUuid()}.cjs`, getTmpUrl());

  await writeFileAsync(
    new URL(specifier),
    `
      const { strict: { equal: assertEqual } } = require("node:assert");
      exports.createTransformer = (options) => {
        assertEqual(options, "options");
        return {
          process: (content, path, options) => ({
            code: content + content,
            map: null,
          }),
          processAsync: (content, path, options) => Promise.resolve({
            code: content + content,
            map: null,
          }),
        };
      };
    `,
    "utf8",
  );

  const createTransformer = compileCreateTransformer(
    extendConfiguration(
      createConfiguration("file:///A:/home/"),
      {
        hooks: {
          apply: false,
          cjs: true,
          esm: false,
          eval: true,
          http: false,
          mysql: false,
          sqlite3: false,
          pg: false,
        },
        packages: [
          {
            glob: "*.cjs",
            enabled: true,
          },
        ],
        "default-package": {
          enabled: false,
        },
      },
      "file:///A:/base/",
    ),
  );

  const transformer = createTransformer({
    "\\.cjs$": {
      specifier: convertFileUrlToPath(specifier),
      options: "options",
    },
  });

  for (const asynchronous of [true, false]) {
    const method = asynchronous ? "processAsync" : "process";
    {
      const result = transformer[method](
        "eval(123);",
        convertFileUrlToPath("file:///A:/base/script.cjs"),
        { supportsStaticESM: false },
      );
      assertMatch(
        (asynchronous ? await result : result).code,
        /APPMAP_HOOK_EVAL.*\n.*APPMAP_HOOK_EVAL/u,
      );
    }
    {
      const result = transformer[method](
        "eval(123);",
        convertFileUrlToPath("file:///A:/base/script.mjs"),
        { supportsStaticESM: true },
      );
      assertDeepEqual(asynchronous ? await result : result, {
        code: "eval(123);",
        map: null,
      });
    }
  }
}

///////////////////////////////////////////////
// ESM && With Source Map && No processAsync //
///////////////////////////////////////////////

{
  const specifier = toAbsoluteUrl(`${getUuid()}.js`, getTmpUrl());

  await writeFileAsync(
    new URL(specifier),
    `
      const { strict: { equal: assertEqual } } = require("node:assert");
      exports.createTransformer = (options) => {
        assertEqual(options, "options");
        return {
          process: (content, path, options) => ({
            code: content + content,
            map: {
              version: 3,
              file: "source.map.json",
              sourceRoot: "",
              sources: ["file:///A:/base/source.esm"],
              names: [],
              mappings: "",
            },
          }),
        };
      };
    `,
    "utf8",
  );

  const createTransformer = compileCreateTransformer(
    extendConfiguration(
      createConfiguration("file:///A:/home/"),
      {
        hooks: {
          apply: false,
          cjs: false,
          esm: true,
          eval: true,
          http: false,
          mysql: false,
          sqlite3: false,
          pg: false,
        },
        packages: [
          {
            path: "source.esm",
            enabled: true,
          },
        ],
        "default-package": {
          enabled: false,
        },
      },
      "file:///A:/base/",
    ),
  );

  const transformer = createTransformer({
    "\\.js$": {
      specifier: convertFileUrlToPath(specifier),
      options: "options",
    },
  });

  assertMatch(
    get(
      await transformer.processAsync(
        "eval(123);",
        convertFileUrlToPath("file:///A:/base/script.js"),
        { supportsStaticESM: true },
      ),
      "code",
    ),
    /APPMAP_HOOK_EVAL.*\n.*APPMAP_HOOK_EVAL/u,
  );
}
