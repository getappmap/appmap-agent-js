// https://github.com/facebook/jest/blob/ee63afcbe7904d18558d3cc40e0940804df3deb7/packages/jest-transform/src/ScriptTransformer.ts#L261

import { cwd } from "node:process";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const {
  Error,
  RegExp,
  undefined,
  JSON: { stringify: stringifyJSON },
  Reflect: { defineProperty, getOwnPropertyDescriptor },
  Object: {
    entries: toEntries,
    hasOwn = (object, key) =>
      getOwnPropertyDescriptor(object, key) !== undefined,
  },
} = globalThis;

const require = createRequire(`${pathToFileURL(cwd())}/`);

const loadTransformer = (specifier, options) => {
  const transformer = require(specifier);
  if (
    hasOwn(transformer, "createTransformer") &&
    typeof transformer.createTransformer === "function"
  ) {
    return transformer.createTransformer(options);
  } else {
    return transformer;
  }
};

const loadEntry = ([pattern, { specifier, options }]) => [
  new RegExp(pattern, "u"),
  {
    specifier,
    transformer: loadTransformer(specifier, options),
  },
];

export const transformDefault = (source, _path, _config) => source;

if (!hasOwn(globalThis, "__APPMAP_JEST_HOOK__")) {
  defineProperty(globalThis, "__APPMAP_JEST_HOOK__", {
    __proto__: null,
    value: {
      transform: transformDefault,
    },
    writable: true,
    configurable: true,
    enumerable: false,
  });
}

const sanitizeSource = ({ code = null, map = null }, specifier) => {
  if (typeof code !== "string") {
    throw new Error(
      `Transformer ${stringifyJSON(
        specifier,
      )} should return an object whose code property is a string`,
    );
  } else {
    return {
      code,
      map,
    };
  }
};

export const hook = globalThis.__APPMAP_JEST_HOOK__;

export default {
  createTransformer: (config) => {
    const transformers = toEntries(config).map(loadEntry);
    return {
      canInstrument: false,
      process: (content, path, options) => {
        for (const [regexp, { specifier, transformer }] of transformers) {
          if (regexp.test(path)) {
            if (hasOwn(transformer, "process")) {
              return hook.transform(
                sanitizeSource(transformer.process(content, path, options)),
                path,
                options,
              );
            } else {
              throw new Error(
                `Transformer at ${stringifyJSON(
                  specifier,
                )} should export process`,
              );
            }
          }
        }
        return hook.transform({ code: content, map: null }, path, options);
      },
      processAsync: async (content, path, options) => {
        for (const [regexp, { specifier, transformer }] of transformers) {
          if (regexp.test(path)) {
            if (hasOwn(transformer, "processAsync")) {
              return hook.transform(
                sanitizeSource(
                  await transformer.processAsync(content, path, options),
                ),
                path,
                options,
              );
            } else if (hasOwn(transformer, "process")) {
              return hook.transform(
                sanitizeSource(transformer.process(content, path, options)),
                path,
                options,
              );
            } else {
              throw new Error(
                `Transformer at ${stringifyJSON(
                  specifier,
                )} should either export process or processAsync`,
              );
            }
          }
        }
        return hook.transform({ code: content, map: null }, path, options);
      },
    };
  },
};
