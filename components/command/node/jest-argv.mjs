import * as Minimist from "minimist";
import { ExternalAppmapError } from "../../error/index.mjs";
import { logError, logErrorWhen } from "../../log/index.mjs";
import { hasOwnProperty, assert, constant } from "../../util/index.mjs";
import { self_directory } from "../../self/index.mjs";
import { convertFileUrlToPath } from "../../path/index.mjs";
import { toAbsoluteUrl, toDirectoryUrl } from "../../url/index.mjs";
import { loadJestConfigAsync, resolveJestPresetAsync } from "./jest-config.mjs";

const {
  JSON: { stringify: stringifyJSON, parse: parseJSON },
  Object: { entries: toEntries, fromEntries },
  Array: { isArray },
} = globalThis;

const { default: minimist } = Minimist;

const hook = convertFileUrlToPath(
  toAbsoluteUrl("lib/node/transformer-jest.mjs", self_directory),
);

const extractTransformEntryValue = (value) => {
  if (typeof value === "string") {
    return { specifier: value, options: {} };
  } else {
    assert(
      !logErrorWhen(
        !isArray(value) || value.length !== 2 || typeof value[0] !== "string",
        "Invalid transform field, expected transform field to be either a string or an array of length two whose first element is a string: %j",
        value,
      ),
      "Invalid transform field",
      ExternalAppmapError,
    );
    return { specifier: value[0], options: value[1] };
  }
};

const compileHookTransformEntry = (root) => {
  const replacement = constant(convertFileUrlToPath(root));
  return ([key, value]) => {
    const { specifier, options } = extractTransformEntryValue(value);
    return [
      key,
      {
        specifier: specifier.replace(/<rootDir>\//gu, replacement),
        options,
      },
    ];
  };
};

const hookTransformObject = (transform, root) => ({
  "^": [
    hook,
    fromEntries(toEntries(transform).map(compileHookTransformEntry(root))),
  ],
});

export const hookJestArgvAsync = async (argv, base) => {
  if (!argv.includes("--no-cache")) {
    argv = ["--no-cache", ...argv];
  }
  const options = minimist(argv);
  const root = hasOwnProperty(options, "rootDir")
    ? toDirectoryUrl(toAbsoluteUrl(options.rootDir, base))
    : base;
  if (hasOwnProperty(options, "transform")) {
    const index = argv.indexOf("--transform");
    assert(
      !logErrorWhen(
        index !== argv.lastIndexOf("--transform"),
        "Jest `--transform` argument should not be duplicate: %j",
        argv,
      ),
      "Jest --transform argument should not be duplicate",
      ExternalAppmapError,
    );
    assert(
      !logErrorWhen(
        index === argv.length - 1,
        "Jest `--transform` argument should not be in last postion: %j",
        argv,
      ),
      "Jest `--transform` argument should not be in last postion",
      ExternalAppmapError,
    );
    let transform = argv[index + 1];
    try {
      transform = parseJSON(transform);
    } catch (error) {
      logError(
        "Jest `--transform` argument should be a json string: %j >> %O",
        transform,
        error,
      );
      throw new ExternalAppmapError(
        "Jest --transform argument should be a json string",
      );
    }
    return [
      ...argv.slice(0, index + 1),
      stringifyJSON(hookTransformObject(transform, root)),
      ...argv.slice(index + 2, argv.length),
    ];
  } else {
    const config = await resolveJestPresetAsync(
      await loadJestConfigAsync(options, { root, base }),
      root,
    );
    const transform = hasOwnProperty(config, "transform")
      ? config.transform
      : // Default jest transformer.
        // cf: https://jestjs.io/docs/code-transformation#defaults
        // Unfortunately `require("jest-config").defaults.transform` is undefined
        { "\\.[jt]sx?$": "babel-jest" };
    return [
      ...argv,
      "--transform",
      stringifyJSON(hookTransformObject(transform, root)),
    ];
  }
};
